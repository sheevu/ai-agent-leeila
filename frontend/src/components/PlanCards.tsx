interface PlanCardsProps {
  params?: Record<string, unknown>;
}

const plans = [
  {
    id: "starter",
    name: "Udaan Starter",
    price: "₹2,999/mo",
    focus: "online_presence",
    budget: "low",
    bullets: ["WhatsApp catalogue", "Google My Business setup", "1 landing page"],
  },
  {
    id: "growth",
    name: "Tez Growth",
    price: "₹7,999/mo",
    focus: "sales",
    budget: "medium",
    bullets: ["Instagram + Facebook ads", "Mini CRM dashboard", "Lead automation"],
  },
  {
    id: "premium",
    name: "Astra Premium",
    price: "₹14,999/mo",
    focus: "branding",
    budget: "high",
    bullets: ["Full commerce portal", "Voice bot", "Offline-to-online funnels"],
  },
];

function filterPlans(params?: Record<string, unknown>) {
  if (!params) return plans;
  return plans.filter((plan) => {
    const matchesBudget = !params.budget || params.budget === plan.budget;
    const matchesGoal = !params.goal || params.goal === plan.focus;
    return matchesBudget && matchesGoal;
  });
}

export function PlanCards({ params }: PlanCardsProps) {
  const visiblePlans = filterPlans(params);

  return (
    <div className="widget-card">
      <h3>Sudarshan Plans</h3>
      <div className="plan-grid">
        {visiblePlans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h4>{plan.name}</h4>
              <span className="plan-price">{plan.price}</span>
            </div>
            <ul>
              {plan.bullets.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="plan-actions">
              <button type="button">Request callback</button>
              <button type="button" className="outline">
                WhatsApp karo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlanCards;
