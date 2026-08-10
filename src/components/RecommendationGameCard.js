import React from "react";
import AiSecondOpinion from "./AiSecondOpinion";

const isSamePick = (a, b) => {
  if (!a?.recommendation || !b?.recommendation) return false;
  return (
    String(a.type ?? "") === String(b.type ?? "") &&
    String(a.recommendation.bet ?? "") === String(b.recommendation.bet ?? "")
  );
};

const fmtPickLine = (card) => {
  if (!card?.recommendation) return "—";
  const bet = card.recommendation.bet;
  const conf = card.recommendation.confidence;
  if (bet === "AVOID") return "AVOID";
  const confLabel =
    conf != null && !Number.isNaN(Number(conf))
      ? ` (${Number(conf).toFixed(1)}%)`
      : "";
  return `${bet}${confLabel}`;
};

const isCardTicketReady = (card) => {
  if (!card?.recommendation) return false;
  const conf = parseFloat(card.recommendation.confidence);
  if (isNaN(conf)) return false;
  if (card.recommendation.bet === "AVOID") return false;
  if (card.oddsPerformance?.type === "warning") return false;
  if (card.oddsTrapWarning?.isTrap) return false;
  if (card.type === "Straight Win" && conf >= 85) return true;
  if (conf < 70) return false;
  if ((card.riskLevel || "").toLowerCase() === "high") return false;
  return true;
};

const FormLetters = ({ letters }) => {
  const list = Array.isArray(letters) ? letters : [];
  if (!list.length) {
    return <span className="text-gray-500">—</span>;
  }
  return (
    <span className="inline-flex gap-0.5">
      {list.map((L, i) => {
        const c = String(L).toUpperCase();
        const color =
          c === "W"
            ? "bg-emerald-500/30 text-emerald-200"
            : c === "D"
              ? "bg-white/10 text-gray-300"
              : c === "L"
                ? "bg-rose-500/30 text-rose-200"
                : "bg-white/10 text-gray-400";
        return (
          <span
            key={`${c}-${i}`}
            className={`w-5 h-5 inline-flex items-center justify-center rounded text-[10px] font-semibold ${color}`}
          >
            {c}
          </span>
        );
      })}
    </span>
  );
};

const SofaEnrichPanel = ({ sofaEnrich }) => {
  if (!sofaEnrich?.matched) return null;

  const impact = sofaEnrich.impact;
  const h2h = sofaEnrich.h2h;
  const homeForm = sofaEnrich.homeForm?.form || [];
  const awayForm = sofaEnrich.awayForm?.form || [];
  const streaks = sofaEnrich.keyStreaks || [];
  const homeMiss = sofaEnrich.homeMissing || [];
  const awayMiss = sofaEnrich.awayMissing || [];
  const impactNotes = (impact?.note || "")
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);

  const sideLabel = (team) => {
    if (team === "home") return "Home";
    if (team === "away") return "Away";
    if (team === "both") return "Both";
    return team || "";
  };

  const verdictStyles =
    impact?.tier === "caution"
      ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
      : impact?.tier === "support"
        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
        : "border-teal-400/30 bg-teal-500/10 text-teal-100";

  return (
    <div className="rounded-lg border border-teal-400/25 bg-black/20 px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-teal-300 text-[10px] font-semibold uppercase tracking-wide">
          SofaScore context
        </div>
        {impact?.confidenceDelta != null && impact.confidenceDelta !== 0 && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded border ${verdictStyles}`}
          >
            Confidence {impact.confidenceDelta > 0 ? "+" : ""}
            {impact.confidenceDelta}
          </span>
        )}
      </div>

      {(sofaEnrich.sofaHome || sofaEnrich.sofaAway) && (
        <p className="text-xs text-gray-400">
          {sofaEnrich.sofaHome || "Home"} vs {sofaEnrich.sofaAway || "Away"}
          {sofaEnrich.sofaDate ? ` · ${sofaEnrich.sofaDate}` : ""}
          {sofaEnrich.tournament ? ` · ${sofaEnrich.tournament}` : ""}
        </p>
      )}

      {impactNotes.length > 0 && (
        <div className={`rounded-md border px-2.5 py-2 ${verdictStyles}`}>
          <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">
            {impact?.tier === "caution"
              ? "Caution"
              : impact?.tier === "support"
                ? "Supports stake"
                : "Note"}
          </div>
          <ul className="space-y-1 text-xs leading-snug">
            {impactNotes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        </div>
      )}

      {h2h && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Head to head
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-white/5 border border-white/10 px-2 py-2">
              <div className="text-[10px] text-gray-500">Home wins</div>
              <div className="text-lg font-semibold text-white">{h2h.homeWins}</div>
            </div>
            <div className="rounded-md bg-white/5 border border-white/10 px-2 py-2">
              <div className="text-[10px] text-gray-500">Draws</div>
              <div className="text-lg font-semibold text-white">{h2h.draws}</div>
            </div>
            <div className="rounded-md bg-white/5 border border-white/10 px-2 py-2">
              <div className="text-[10px] text-gray-500">Away wins</div>
              <div className="text-lg font-semibold text-white">{h2h.awayWins}</div>
            </div>
          </div>
        </div>
      )}

      {(homeForm.length > 0 || awayForm.length > 0) && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Recent form
            <span className="normal-case font-normal text-gray-600 ml-1">
              (
              {sofaEnrich.formSource === "pregame-form"
                ? "official"
                : "last 5"}
              )
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 shrink-0 w-12">Home</span>
              <div className="flex-1 min-w-0 truncate text-gray-400 text-[11px]">
                {sofaEnrich.sofaHome || ""}
              </div>
              <FormLetters letters={homeForm} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 shrink-0 w-12">Away</span>
              <div className="flex-1 min-w-0 truncate text-gray-400 text-[11px]">
                {sofaEnrich.sofaAway || ""}
              </div>
              <FormLetters letters={awayForm} />
            </div>
          </div>
        </div>
      )}

      {streaks.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Key streaks
          </div>
          <div className="flex flex-wrap gap-1.5">
            {streaks.map((s) => (
              <span
                key={`${s.short}-${s.team}-${s.value}-${s.source}`}
                className="inline-flex items-center gap-1 rounded-md border border-teal-400/25 bg-teal-500/10 px-2 py-1 text-[11px] text-teal-100"
                title={s.name}
              >
                <span className="font-semibold">{s.short}</span>
                <span className="text-teal-200/90">{s.value}</span>
                {s.team ? (
                  <span className="text-teal-200/60">{sideLabel(s.team)}</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      )}

      {(homeMiss.length > 0 || awayMiss.length > 0) && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Missing / doubtful
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5">
              <div className="text-gray-500 mb-1">Home ({homeMiss.length})</div>
              {homeMiss.length === 0 ? (
                <div className="text-gray-600">None listed</div>
              ) : (
                <ul className="space-y-0.5 text-gray-300">
                  {homeMiss.slice(0, 5).map((p) => (
                    <li key={`h-${p.name}`}>
                      {p.name}
                      {p.description || p.type
                        ? ` — ${p.description || p.type}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-md bg-white/5 border border-white/10 px-2 py-1.5">
              <div className="text-gray-500 mb-1">Away ({awayMiss.length})</div>
              {awayMiss.length === 0 ? (
                <div className="text-gray-600">None listed</div>
              ) : (
                <ul className="space-y-0.5 text-gray-300">
                  {awayMiss.slice(0, 5).map((p) => (
                    <li key={`a-${p.name}`}>
                      {p.name}
                      {p.description || p.type
                        ? ` — ${p.description || p.type}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Single recommendation card (stake pick + details + AI).
 */
function RecommendationGameCard({
  rec,
  recKey,
  expanded,
  onToggleExpanded,
  filterTicketReady = false,
  aiResult,
  aiError,
  aiLoading,
  onFetchAi,
  renderCalibratedLine,
  onTicket = false,
  ticketBadge = false,
  borderClass = "border-white/10",
  sofaEnrich = null,
}) {
  const hero = rec.bestBet || rec.primary;
  const detailAlts = [
    rec.primary && (!hero || !isSamePick(hero, rec.primary))
      ? { label: "Primary", card: rec.primary, accent: "yellow" }
      : null,
    rec.secondary
      ? { label: "Secondary", card: rec.secondary, accent: "slate" }
      : null,
    rec.tertiary
      ? { label: "Tertiary", card: rec.tertiary, accent: "orange" }
      : null,
  ].filter(
    (x) => x && x.card && (!filterTicketReady || isCardTicketReady(x.card))
  );
  const form = rec.recentFormData;
  const formHome = form
    ? `${form.homeWins ?? 0}W-${form.homeDraws ?? 0}D-${form.homeLosses ?? 0}L`
    : null;
  const formAway = form
    ? `${form.awayWins ?? 0}W-${form.awayDraws ?? 0}D-${form.awayLosses ?? 0}L`
    : null;

  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-xl border ${borderClass} overflow-hidden`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-white/10">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-white">{rec.match}</h4>
          <p className="text-gray-400 text-xs mt-0.5">
            {rec.country} · {rec.league}
            {form && (
              <span className="text-gray-500">
                {" "}
                · Form {formHome} / {formAway}
                {form.formSource === "previous_season" ? " (prev season)" : ""}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(onTicket || ticketBadge) && (
              <span className="px-1.5 py-0.5 rounded text-[11px] border bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-medium">
                On ticket
              </span>
            )}
            {sofaEnrich && (
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] border ${
                  sofaEnrich.error && !sofaEnrich.matched
                    ? "bg-gray-500/15 border-gray-500/30 text-gray-400"
                    : sofaEnrich.impact?.tier === "caution"
                      ? "bg-rose-500/20 border-rose-400/40 text-rose-200"
                      : sofaEnrich.impact?.tier === "support"
                        ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                        : (sofaEnrich.homeMissing?.length || 0) +
                              (sofaEnrich.awayMissing?.length || 0) >
                            0
                          ? "bg-rose-500/20 border-rose-400/40 text-rose-200"
                          : "bg-teal-500/15 border-teal-400/40 text-teal-200"
                }`}
                title={
                  sofaEnrich.error ||
                  [
                    sofaEnrich.h2hSummary || sofaEnrich.impact?.h2hLabel,
                    sofaEnrich.formSummary
                      ? `Form: ${sofaEnrich.formSummary}`
                      : null,
                    sofaEnrich.streaksSummary
                      ? `Streaks: ${sofaEnrich.streaksSummary}`
                      : null,
                    sofaEnrich.impact?.note,
                    sofaEnrich.summary,
                    ...(sofaEnrich.homeMissing || []).map(
                      (p) => `Home: ${p.name} (${p.description || p.type})`
                    ),
                    ...(sofaEnrich.awayMissing || []).map(
                      (p) => `Away: ${p.name} (${p.description || p.type})`
                    ),
                  ]
                    .filter(Boolean)
                    .join("\n")
                }
              >
                SofaScore
                {sofaEnrich.matched
                  ? ` · ${[
                      sofaEnrich.h2h
                        ? `H2H ${sofaEnrich.h2h.homeWins}-${sofaEnrich.h2h.draws}-${sofaEnrich.h2h.awayWins}`
                        : null,
                      sofaEnrich.homeForm?.form?.length ||
                      sofaEnrich.awayForm?.form?.length
                        ? "Form"
                        : null,
                      sofaEnrich.keyStreaks?.length
                        ? `${sofaEnrich.keyStreaks.length} streaks`
                        : null,
                      `Out ${sofaEnrich.homeMissing?.length || 0}/${sofaEnrich.awayMissing?.length || 0}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}`
                  : " · no match"}
              </span>
            )}
            {rec.earlySeason && (
              <span
                className="px-1.5 py-0.5 rounded text-[11px] border bg-sky-500/15 border-sky-400/40 text-sky-200"
                title={rec.earlySeason.detail}
              >
                Early season
                {rec.earlySeason.homeGamesPlayed != null ||
                rec.earlySeason.awayGamesPlayed != null
                  ? ` · ${rec.earlySeason.homeGamesPlayed ?? "—"}/${rec.earlySeason.awayGamesPlayed ?? "—"} gp`
                  : ""}
              </span>
            )}
            {rec.blacklistWarning && (
              <span
                className="px-1.5 py-0.5 rounded text-[11px] border bg-red-500/20 border-red-400/50 text-red-200 font-medium"
                title={rec.blacklistWarning.message}
              >
                Blacklisted
                {rec.blacklistWarning.teams?.length
                  ? `: ${rec.blacklistWarning.teams.join(" · ")}`
                  : ""}
              </span>
            )}
            {rec.performanceNote && (
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] border ${
                  rec.performanceNote.tier === "caution"
                    ? "bg-red-500/15 border-red-500/30 text-red-300"
                    : rec.performanceNote.tier === "risky"
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      : rec.performanceNote.tier === "strong"
                        ? "bg-green-500/15 border-green-500/30 text-green-300"
                        : "bg-white/5 border-white/15 text-gray-300"
                }`}
                title={`Your record in ${rec.performanceNote.label}`}
              >
                {rec.performanceNote.label}{" "}
                {(rec.performanceNote.winRate * 100).toFixed(0)}%
              </span>
            )}
            {rec.lossWarning?.isRisky && (
              <span
                className="px-1.5 py-0.5 rounded text-[11px] border bg-red-500/15 border-red-500/30 text-red-300"
                title={rec.lossWarning.message}
              >
                Loss pattern
              </span>
            )}
            {rec.oddsTrapOnBestBet && (
              <span
                className="px-1.5 py-0.5 rounded text-[11px] border bg-amber-500/15 border-amber-500/30 text-amber-300"
                title={rec.bestBet?.oddsTrapWarning?.message}
              >
                Odds trap
              </span>
            )}
            {rec.lossRuleNotes?.length > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[11px] border bg-indigo-500/15 border-indigo-400/30 text-indigo-200"
                title={rec.lossRuleNotes.join("\n")}
              >
                Loss rules
              </span>
            )}
            {rec.proposedBetVerdict != null && (
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] border ${
                  rec.proposedBetVerdict.agrees
                    ? "bg-green-500/15 border-green-500/30 text-green-300"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                }`}
                title={rec.proposedBetVerdict.reason || ""}
              >
                You: {rec.proposedBetLabel || "—"} ·{" "}
                {rec.proposedBetVerdict.agrees ? "Agree" : "Disagree"}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-blue-400 font-semibold text-sm">
            {(
              Number(rec.confidence || 0) +
              Number(sofaEnrich?.impact?.confidenceDelta || 0)
            ).toFixed(1)}
            %
          </div>
          <div className="text-gray-500 text-xs">Odds {rec.odds}</div>
          {!!sofaEnrich?.impact?.confidenceDelta && (
            <div className="text-[10px] text-teal-300/80 mt-0.5">
              incl. Sofa adj
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {hero && (!filterTicketReady || isCardTicketReady(hero)) && (
          <div className="rounded-lg border border-purple-400/40 bg-purple-500/10 px-4 py-3">
            <div className="text-purple-300 text-[10px] font-semibold uppercase tracking-wide">
              Stake pick
            </div>
            <div className="text-white font-medium mt-0.5">{hero.type}</div>
            <div
              className={`text-lg font-semibold ${
                hero.recommendation.bet === "AVOID"
                  ? "text-red-400"
                  : "text-purple-200"
              }`}
            >
              {fmtPickLine(hero)}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Risk: {hero.riskLevel || "—"}
            </div>
          </div>
        )}

        {sofaEnrich?.matched && <SofaEnrichPanel sofaEnrich={sofaEnrich} />}

        {(aiResult || aiError || aiLoading) && (
          <AiSecondOpinion
            result={aiResult}
            error={aiError}
            loading={aiLoading}
            onFetch={() => onFetchAi(rec)}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleExpanded(recKey)}
            className="text-xs px-2.5 py-1 rounded border border-white/15 text-gray-300 hover:bg-white/10"
          >
            {expanded
              ? "Hide details"
              : `Details${detailAlts.length ? ` · ${detailAlts.length} alt` : ""}`}
          </button>
          {!aiResult && !aiLoading && (
            <button
              type="button"
              onClick={() => onFetchAi(rec)}
              className="text-xs px-2.5 py-1 rounded border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/20"
            >
              AI pick
            </button>
          )}
        </div>

        {expanded && (
          <div className="space-y-3 pt-1 border-t border-white/10">
            {detailAlts.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Alternatives
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailAlts.map(({ label, card, accent }) => {
                    const accentBorder =
                      accent === "yellow"
                        ? "border-l-yellow-400/70"
                        : accent === "orange"
                          ? "border-l-orange-400/70"
                          : "border-l-slate-400/70";
                    const accentText =
                      accent === "yellow"
                        ? "text-yellow-300"
                        : accent === "orange"
                          ? "text-orange-300"
                          : "text-slate-300";
                    const pickText =
                      accent === "yellow"
                        ? "text-green-400"
                        : accent === "orange"
                          ? "text-orange-400"
                          : "text-blue-400";
                    const tierKey =
                      label === "Primary"
                        ? "primary"
                        : label === "Secondary"
                          ? "secondary"
                          : "tertiary";
                    return (
                      <div
                        key={label}
                        className={`rounded-lg border border-white/10 border-l-2 ${accentBorder} bg-white/[0.03] p-2.5`}
                      >
                        <div
                          className={`${accentText} font-semibold text-[10px] uppercase tracking-wide mb-1`}
                        >
                          {label}
                        </div>
                        <div className="text-white text-sm">{card.type}</div>
                        <div className={`text-sm ${pickText}`}>
                          {fmtPickLine(card)}
                        </div>
                        {renderCalibratedLine?.(tierKey, card)}
                        {card.oddsPerformance?.message && (
                          <div className="text-[11px] mt-1 text-gray-400">
                            {card.oddsPerformance.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rec.proposedBetVerdict?.reason &&
              !rec.proposedBetVerdict.agrees && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {rec.proposedBetVerdict.reason}
                </p>
              )}
            {rec.lossRuleNotes?.length > 0 && (
              <ul className="text-xs text-indigo-200/90 space-y-0.5">
                {rec.lossRuleNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            )}
            {hero?.oddsPerformance?.message && (
              <p className="text-xs text-gray-400">
                {hero.oddsPerformance.message}
              </p>
            )}
            {!aiResult && !aiError && (
              <AiSecondOpinion
                result={aiResult}
                error={aiError}
                loading={aiLoading}
                onFetch={() => onFetchAi(rec)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationGameCard;
