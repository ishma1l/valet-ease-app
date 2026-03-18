interface TimeWindowCardProps {
  id: string;
  label: string;
  time: string;
  selected: boolean;
  onClick: (id: string) => void;
}

const TimeWindowCard = ({ id, label, time, selected, onClick }: TimeWindowCardProps) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full p-4 rounded-2xl flex flex-col transition-all duration-200 text-left
      ${selected
        ? "bg-primary text-primary-foreground shadow-lg"
        : "bg-card ring-1 ring-border text-foreground"}`}
  >
    <span className="font-bold">{label}</span>
    <span className={`text-sm ${selected ? "opacity-70" : "text-muted-foreground"}`}>{time}</span>
  </button>
);

export default TimeWindowCard;
