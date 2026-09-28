import { useLocale, useTranslations } from "next-intl";
import { compareStrategies, strategyRegistry, type Profile } from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";

export function PlanComparison({ profile }: { profile: Profile }) {
  const results = compareStrategies(profile, strategyRegistry);
  const t = useTranslations("plan");
  const locale = useLocale() as Locale;
  const investingLesson = getLessonCard("index-funds", locale);

  return (
    <div>
      {results.map(({ strategyId, allocation }) => {
        const strategy = strategyRegistry[strategyId];
        const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;

        return (
          <section key={strategyId} aria-label={strategyId} data-testid={`strategy-${strategyId}`}>
            <h2>{lesson?.title ?? strategyId}</h2>
            <dl>
              <dt>{t("needs")}</dt>
              <dd>{allocation.needs}</dd>
              <dt>{t("wants")}</dt>
              <dd>{allocation.wants}</dd>
              <dt>{t("savings")}</dt>
              <dd>{allocation.savings}</dd>
              <dt>{t("investing")}</dt>
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
      {investingLesson && (
        <a
          href={`#lesson-${investingLesson.id}`}
          aria-label={`${investingLesson.id} lesson`}
          data-testid="lesson-link-index-funds"
        >
          {investingLesson.title}
        </a>
      )}
    </div>
  );
}
