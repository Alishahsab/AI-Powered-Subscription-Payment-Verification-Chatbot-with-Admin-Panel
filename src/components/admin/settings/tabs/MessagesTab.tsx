import { BotMessageSections } from "../MessageSections";
import type { SettingsTabProps } from "../Settings";

export default function MessagesTab(props: SettingsTabProps) {
  return <BotMessageSections tab="messages" {...props} />;
}
