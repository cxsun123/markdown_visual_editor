'use client';

interface ColorPickerPanelProps {
  colors: string[];
  currentColor: string;
  onSelectColor: (color: string) => void;
  onReset?: () => void;
}

export function ColorPickerPanel({
  colors,
  currentColor,
  onSelectColor,
  onReset,
}: ColorPickerPanelProps) {
  const normalizedCurrent = currentColor.toLowerCase().trim();

  return (
    <div className="min-w-[220px]">
      <div className="flex flex-wrap gap-1.5 max-w-[260px]">
        {colors.map((color) => {
          const isSelected = normalizedCurrent === color.toLowerCase();
          const isWhite = color.toLowerCase() === '#ffffff';
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className={`w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95 ${
                isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800'
                  : isWhite
                    ? 'border border-gray-300'
                    : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}
      </div>

      <div className="flex gap-2 mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700">
        <label className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-200">
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            onChange={(e) => onSelectColor(e.target.value)}
          />
          自定义...
        </label>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
}
