import { compareStrategies, strategyRegistry, type Profile } from "@stoafi/core";
import { getLessonCard } from "@/lessons";

export function PlanComparison({ profile }: { profile: Profile }) {
  const results = compareStrategies(profile, strategyRegistry);

  return (
    <div>
      {results.map(({ strategyId, allocation }) => {
        const strategy = strategyRegistry[strategyId];
        const lesson = strategy ? getLessonCard(strategy.lessonId) : undefined;

        return (
          <section key={strategyId} aria-label={strategyId} data-testid={`strategy-${strategyId}`}>
            <h2>{lesson?.title ?? strategyId}</h2>
            <dl>
              <dt>Needs</dt>
              <dd>{allocation.needs}</dd>
              <dt>Wants</dt>
              <dd>{allocation.wants}</dd>
              <dt>Savings</dt>
              <dd>{allocation.savings}</dd>
              <dt>Investing</dt>
              <dd>{allocation.investing}</dd>
            </dl>
            {lesson && (
              <article aria-label={`${strategyId} lesson`}>
                <p>{lesson.principle}</p>
                <footer>
                  {lesson.source.author}, {lesson.source.work}
                </footer>
              </article>
            )}
          </section>
        );
      })}
    </div>
  );
}
