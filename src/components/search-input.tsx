import { Search } from "lucide-react-native";
import { TextInput, View, type TextInputProps } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { cn } from "@/utils/cn";

interface SearchInputProps extends TextInputProps {
  className?: string;
}

export const SearchInput = ({ className, ...rest }: SearchInputProps) => {
  const { palette } = useAppTheme();

  return (
    <View
      className={cn(
        "min-h-14 flex-row items-center gap-3 rounded-3xl border border-border bg-surface px-4",
        className,
      )}
    >
      <Search color={palette.textSecondary} size={18} strokeWidth={2.2} />
      <TextInput
        className="flex-1 font-body text-sm text-text-primary"
        placeholderTextColor={palette.textTertiary}
        {...rest}
      />
    </View>
  );
};
