interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  selected: boolean;
  onClick: (id: string) => void;
}

const ServiceCard = ({ id, title, description, price, selected, onClick }: ServiceCardProps) => (
  <button
    onClick={() => onClick(id)}
    className={`relative w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 text-left
      ${selected
        ? "bg-accent ring-2 ring-primary shadow-sm"
        : "bg-card ring-1 ring-border hover:ring-muted-foreground/20 shadow-sm"}`}
  >
    <div className="flex flex-col">
      <span className={`font-semibold ${selected ? "text-accent-foreground" : "text-foreground"}`}>{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
    <span className="text-lg font-bold tabular-nums">£{price}</span>
  </button>
);

export default ServiceCard;
