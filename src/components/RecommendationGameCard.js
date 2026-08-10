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
            {(rec.confidence ?? 0).toFixed(1)}%
          </div>
          <div className="text-gray-500 text-xs">Odds {rec.odds}</div>
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
