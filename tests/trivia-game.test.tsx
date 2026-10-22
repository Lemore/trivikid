import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TriviaGame } from "@/components/trivia/TriviaGame";
import { strings } from "@/lib/strings";

const question = {
  status: "ok",
  question: "איזה כוכב לכת הוא הגדול ביותר?",
  options: ["מאדים", "צדק", "נוגה", "שבתאי"],
  correctIndex: 1,
  explanation: "צדק הוא הגדול ביותר.",
};

const fetchMock = vi.fn();

function respondWith(body: unknown) {
  fetchMock.mockResolvedValue({ json: async () => body });
}

function typeTopic(text: string) {
  fireEvent.change(screen.getByLabelText(strings.trivia.topicLabel), {
    target: { value: text },
  });
}

async function requestQuestion() {
  fireEvent.click(screen.getByRole("button", { name: strings.trivia.newQuestion }));
  await screen.findByRole("heading", { name: question.question });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function clickNewQuestion() {
  fireEvent.click(screen.getByRole("button", { name: strings.trivia.newQuestion }));
}

describe("TriviaGame", () => {
  test("an empty topic sends no request and shows the empty-topic prompt", () => {
    render(<TriviaGame />);
    clickNewQuestion();
    expect(screen.getByText(strings.trivia.emptyTopic)).toBeInTheDocument();
    typeTopic("   ");
    clickNewQuestion();
    expect(screen.getByText(strings.trivia.emptyTopic)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.trivia.retry })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("the topic input is limited to 50 characters", () => {
    render(<TriviaGame />);
    expect(screen.getByLabelText(strings.trivia.topicLabel)).toHaveAttribute("maxLength", "50");
  });

  test("when the browser is offline, no request is sent and the no-connection message shows", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<TriviaGame />);
    typeTopic("חלל");
    clickNewQuestion();
    expect(screen.getByText(strings.trivia.offline)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.trivia.retry })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a network failure shows the no-connection message, and retry works", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<TriviaGame />);
    typeTopic("חלל");
    clickNewQuestion();
    expect(await screen.findByText(strings.trivia.offline)).toBeInTheDocument();

    respondWith(question);
    fireEvent.click(screen.getByRole("button", { name: strings.trivia.retry }));
    expect(await screen.findByRole("heading", { name: question.question })).toBeInTheDocument();
    expect(screen.queryByText(strings.trivia.offline)).not.toBeInTheDocument();
  });

  test("unclear_topic and no_new_question show their messages without a retry button", async () => {
    respondWith({ status: "unclear_topic" });
    render(<TriviaGame />);
    typeTopic("אאאא");
    clickNewQuestion();
    expect(await screen.findByText(strings.trivia.unclearTopic)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.trivia.retry })).not.toBeInTheDocument();

    respondWith({ status: "no_new_question" });
    clickNewQuestion();
    expect(await screen.findByText(strings.trivia.noNewQuestion)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.trivia.retry })).not.toBeInTheDocument();
  });

  test("history is kept per normalized topic and capped at the 30 most recent", async () => {
    render(<TriviaGame />);
    typeTopic("חלל");
    for (let i = 0; i < 31; i++) {
      respondWith({ ...question, question: `שאלה ${i}?` });
      clickNewQuestion();
      await screen.findByRole("heading", { name: `שאלה ${i}?` });
    }
    respondWith(question);
    typeTopic("  חלל ");
    await requestQuestion();
    const lastBody = JSON.parse(fetchMock.mock.lastCall![1].body);
    expect(lastBody.previousQuestions).toHaveLength(30);
    expect(lastBody.previousQuestions[0]).toBe("שאלה 1?");
    expect(lastBody.previousQuestions[29]).toBe("שאלה 30?");

    typeTopic("דינוזאורים");
    await requestQuestion();
    expect(JSON.parse(fetchMock.mock.lastCall![1].body).previousQuestions).toEqual([]);
  });

  test("the button is disabled while loading and double taps send one request", async () => {
    let resolve: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<TriviaGame />);
    typeTopic("חלל");

    const button = screen.getByRole("button", { name: strings.trivia.newQuestion });
    fireEvent.click(button);
    fireEvent.click(button);

    const loading = screen.getByRole("button", { name: strings.trivia.loading });
    expect(loading).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ json: async () => question }));
    expect(screen.getByRole("button", { name: strings.trivia.newQuestion })).toBeEnabled();
  });

  test("a correct answer shows the success message and the fun fact", async () => {
    respondWith(question);
    render(<TriviaGame />);
    typeTopic("חלל");
    await requestQuestion();

    fireEvent.click(screen.getByRole("button", { name: /צדק/ }));
    expect(screen.getByText(strings.trivia.success)).toBeInTheDocument();
    expect(screen.getByText(question.explanation)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /מאדים/ })).not.toBeInTheDocument();
  });

  test("a wrong answer shows the failure message with the correct answer", async () => {
    respondWith(question);
    render(<TriviaGame />);
    typeTopic("חלל");
    await requestQuestion();

    fireEvent.click(screen.getByRole("button", { name: /מאדים/ }));
    expect(screen.getByText(`${strings.trivia.failurePrefix} צדק`)).toBeInTheDocument();
    expect(screen.getByText(question.explanation)).toBeInTheDocument();
  });

  test("the next request on the same topic sends the shown question as history", async () => {
    respondWith(question);
    render(<TriviaGame />);
    typeTopic("חלל");
    await requestQuestion();
    await requestQuestion();

    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody).toEqual({ topic: "חלל", previousQuestions: [question.question] });
  });

  test("a failed request shows the error message and no question, and retry works", async () => {
    respondWith(question);
    render(<TriviaGame />);
    typeTopic("חלל");
    await requestQuestion();

    respondWith({ status: "error" });
    clickNewQuestion();
    expect(await screen.findByText(strings.trivia.error)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();

    respondWith({ ...question, question: "שאלה אחרת?" });
    fireEvent.click(screen.getByRole("button", { name: strings.trivia.retry }));
    expect(await screen.findByRole("heading", { name: "שאלה אחרת?" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
