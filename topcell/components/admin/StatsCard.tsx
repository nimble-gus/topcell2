interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  variant?: "default" | "warning" | "danger" | "success";
}

const variantStyles = {
  default: "bg-white border-gray-200",
  warning: "bg-yellow-50 border-yellow-200",
  danger: "bg-red-50 border-red-200",
  success: "bg-green-50 border-green-200",
};

const valueStyles = {
  default: "text-gray-900",
  warning: "text-yellow-900",
  danger: "text-red-900",
  success: "text-green-900",
};

export default function StatsCard({
  title,
  value,
  description,
  variant = "default",
}: StatsCardProps) {
  return (
    <div className={`overflow-hidden rounded-lg border ${variantStyles[variant]}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
        <div className="mt-1 flex items-baseline">
          <p className={`text-2xl font-semibold ${valueStyles[variant]}`}>
            {value}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

