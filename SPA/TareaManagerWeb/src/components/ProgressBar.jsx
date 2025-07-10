function ProgressBar({ progress }) {
  return (
    <div className="w-32 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-2 bg-blue-500" style={{ width: `${progress}%` }}></div>
    </div>
  );
}

export default ProgressBar;
