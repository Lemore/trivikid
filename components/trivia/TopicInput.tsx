import { TOPIC_MAX_LENGTH } from "@/lib/schemas";
import { strings } from "@/lib/strings";

type TopicInputProps = {
  value: string;
  onChange: (value: string) => void;
};

// Topic label and text input (Tan border by default, Blue border + soft ring on focus).
export function TopicInput({ value, onChange }: TopicInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="topic" className="text-[15px] leading-[1.4] font-medium">
        {strings.trivia.topicLabel}
      </label>
      <input
        id="topic"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={strings.trivia.topicPlaceholder}
        maxLength={TOPIC_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="send"
        className="h-[58px] w-full rounded-control border-[2.5px] border-wood-tan bg-white px-4 text-start text-xl text-ink outline-none placeholder:text-ink/40 focus:border-block-blue focus:ring-4 focus:ring-block-blue/20"
      />
    </div>
  );
}
