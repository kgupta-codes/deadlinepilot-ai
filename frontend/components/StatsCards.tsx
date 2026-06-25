"use client";

import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
} from "lucide-react";

type Props = {
  total: number;
  overdue: number;
  completed: number;
  highPriority: number;
  productivityScore: number;
};

export default function StatsCards({
  total,
  overdue,
  completed,
  highPriority,
  productivityScore,
}: Props) {
  const cards = [
    {
      title: "Total Deadlines",
      value: total,
      icon: ClipboardList,
      color: "text-blue-400",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "High Priority",
      value: highPriority,
      icon: Target,
      color: "text-orange-400",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  {card.title}
                </p>

                <h2
                  className={`text-3xl font-bold mt-2 ${card.color}`}
                >
                  {card.value}
                </h2>
              </div>

              <Icon
                className={card.color}
                size={28}
              />
            </div>
          </div>
        );
      })}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500 transition-all">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">
              Productivity Score
            </p>

            <h2 className="text-3xl font-bold text-purple-400 mt-2">
              {productivityScore}
            </h2>
          </div>

          <TrendingUp
            className="text-purple-400"
            size={28}
          />
        </div>

        <div className="w-full bg-zinc-800 h-2 rounded-full mt-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            style={{
              width: `${productivityScore}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
