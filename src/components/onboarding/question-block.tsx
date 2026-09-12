import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { QuestionField } from '@/components/onboarding/question-field';
import { Spacing } from '@/constants/theme';
import type { Question } from '@/lib/questionnaire/schema';
import type { AnswerValue } from '@/store/onboarding-store';

export type QuestionBlockProps = {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
};

export function QuestionBlock({ question, value, onChange }: QuestionBlockProps) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ gap: 2 }}>
        <ThemedText type="smallBold">
          {question.label}
          {question.optional ? (
            <ThemedText type="caption" themeColor="textTertiary">
              {'  (facoltativo)'}
            </ThemedText>
          ) : null}
        </ThemedText>
        {question.helper ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {question.helper}
          </ThemedText>
        ) : null}
      </View>
      <QuestionField question={question} value={value} onChange={onChange} />
    </View>
  );
}
