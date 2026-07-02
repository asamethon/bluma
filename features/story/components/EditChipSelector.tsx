import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

interface EditChipSelectorProps<T extends string> {
  items: { value: T; label: string }[];
  selectedValue: T | T[];
  onSelect: (value: T) => void;
  styles: {
    quickCategoryChip: any;
    quickCategoryChipActive: any;
    quickCategoryChipText: any;
    quickCategoryChipTextActive: any;
  };
}

// Hedef kitle / dil / içerik uyarısı gibi tekrar eden yatay çip seçici satırı.
export function EditChipSelector<T extends string>({
  items,
  selectedValue,
  onSelect,
  styles,
}: EditChipSelectorProps<T>) {
  const isSelected = (value: T) =>
    Array.isArray(selectedValue) ? selectedValue.includes(value) : selectedValue === value;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.quickCategoryChip,
            isSelected(item.value) && styles.quickCategoryChipActive
          ]}
          onPress={() => onSelect(item.value)}
        >
          <Text style={[
            styles.quickCategoryChipText,
            isSelected(item.value) && styles.quickCategoryChipTextActive
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
