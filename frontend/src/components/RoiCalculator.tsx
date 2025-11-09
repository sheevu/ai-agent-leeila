import { useState } from "react";

interface RoiCalculatorProps {
  params?: Record<string, unknown>;
}

export function RoiCalculator({ params }: RoiCalculatorProps) {
  const [avgOrderValue, setAvgOrderValue] = useState(1500);
  const [marginPercent, setMarginPercent] = useState(20);
  const [extraCustomersPerDay, setExtraCustomersPerDay] = useState(5);
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const monthlyProfit =
      avgOrderValue * (marginPercent / 100) * extraCustomersPerDay * 30;
    setResult(Math.round(monthlyProfit));
  };

  return (
    <div className="widget-card">
      <h3>ROI Calculator</h3>
      <div className="roi-grid">
        <label>
          Avg Order Value (₹)
          <input
            type="number"
            value={avgOrderValue}
            onChange={(event) => setAvgOrderValue(Number(event.target.value))}
          />
        </label>
        <label>
          Margin %
          <input
            type="number"
            value={marginPercent}
            onChange={(event) => setMarginPercent(Number(event.target.value))}
          />
        </label>
        <label>
          Extra Customers / Day
          <input
            type="number"
            value={extraCustomersPerDay}
            onChange={(event) => setExtraCustomersPerDay(Number(event.target.value))}
          />
        </label>
      </div>
      <button type="button" onClick={handleCalculate}>
        Calculate monthly uplift
      </button>
      {result !== null && (
        <div className="roi-result">
          <strong>Lagbhag ₹{result.toLocaleString()} / month extra profit.</strong>
          <p>
            Yeh estimate simple math hai: order value × margin × extra customers × 30 din.
            Aap jitna zyada optimise karoge utna output badhega.
          </p>
          {typeof params?.hint === "string" && (
            <p className="roi-hint">Hint: {params.hint}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default RoiCalculator;
