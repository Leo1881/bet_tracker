import React from "react";

/**
 * Reusable error display with retry action and clearer messaging
 */
const ErrorDisplay = ({
  message,
  onRetry,
  title = "Something went wrong",
  variant = "full", // "full" for full-screen (App), "inline" for tab/section
}) => {
  const content = (
    <div className="text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );

  if (variant === "full") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212] flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="py-8">{content}</div>
    </div>
  );
};

export default ErrorDisplay;
