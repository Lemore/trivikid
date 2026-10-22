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
});

describe("TriviaGame", () => {
  test("an empty topic sends no request", () => {
    render(<TriviaGame />);
    typeTopic("   ");
    fireEvent.click(screen.getByRole("button", { name: strings.trivia.newQuestion }));
    expect(fetchMock).not.toHaveBeenCalled();
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

  test("a failed request shows the error message and no question", async () => {
    respondWith({ status: "error" });
    render(<TriviaGame />);
    typeTopic("חלל");
    fireEvent.click(screen.getByRole("button", { name: strings.trivia.newQuestion }));
    expect(await screen.findByText(strings.trivia.error)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });
});
