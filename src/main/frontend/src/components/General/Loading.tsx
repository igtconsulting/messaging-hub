import React from "react";

type LoadingProps = {
  color?: string;
};

const Loading: React.FC<LoadingProps> = ({ color = "black" }) => {
  return (
    <div className="flex justify-center items-center h-24">
      <div
        className={`w-10 h-10 border-4 border-white/30 border-t-4 rounded-full animate-spin`}
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );
};

export default Loading;
