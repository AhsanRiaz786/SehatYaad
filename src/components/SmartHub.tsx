import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';
import { TimeBlock, getTimeBlock, getTimeBlockInfo } from '../utils/timeBlockUtils';

interface SmartHubAction {
    id: string;
    label: string;
    labelUrdu: string;
    icon: string;
    onPress: () => void;
    priority: number; // Higher priority = shown first
}

interface SmartHubProps {
    actions: SmartHubAction[];
    currentTimeBlock?: TimeBlock;
}

export default function SmartHub({ actions, currentTimeBlock }: SmartHubProps) {
    const { language, isRTL, t } = useLanguage();

    // Determine current time block if not provided
    const activeTimeBlock = useMemo(() => {
        if (currentTimeBlock) return currentTimeBlock;
        const now = new Date();
        const hours = now.getHours();
        if (hours >= 6 && hours < 11) return 'morning';
        if (hours >= 11 && hours < 15) return 'noon';
        if (hours >= 15 && hours < 20) return 'evening';
        return 'night';
    }, [currentTimeBlock]);

    // Sort actions by priority and filter to show top 2-3
    const displayedActions = useMemo(() => {
        return [...actions]
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3);
    }, [actions]);

    const getTimeBlockLabel = (block: TimeBlock): string => {
        const labels = {
            morning: language === 'ur' ? 'صبح کی دوائیں' : 'Morning Meds',
            noon: language === 'ur' ? 'دوپہر کی دوائیں' : 'Noon Meds',
            evening: language === 'ur' ? 'شام کی دوائیں' : 'Evening Meds',
            night: language === 'ur' ? 'رات کی دوائیں' : 'Night Meds',
        };
        return labels[block];
    };

    if (displayedActions.length === 0) {
        return null;
    }

    return (
        <View
            style={[
                styles.container,
                {
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                },
            ]}
        >
            {/* Primary Action - Most prominent */}
            {displayedActions[0] && (
                <TouchableOpacity
                    style={[
                        styles.primaryAction,
                        {
                            backgroundColor: colors.primary.forestGreen,
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            marginRight: displayedActions.length > 1 ? spacing.s : 0,
                        },
                    ]}
                    onPress={displayedActions[0].onPress}
                    accessibilityRole="button"
                    accessibilityLabel={
                        language === 'ur'
                            ? displayedActions[0].labelUrdu
                            : displayedActions[0].label
                    }
                >
                    <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                        <Icon
                            name={displayedActions[0].icon as any}
                            size={24}
                            color={colors.background.white}
                            active={true}
                        />
                    </View>
                    <View style={styles.actionContent}>
                        <AccessibleText
                            variant="button"
                            color={colors.background.white}
                            style={styles.actionLabel}
                        >
                            {language === 'ur'
                                ? displayedActions[0].labelUrdu
                                : displayedActions[0].label}
                        </AccessibleText>
                        {activeTimeBlock && (
                            <AccessibleText
                                variant="caption"
                                color={colors.background.white}
                                style={styles.timeBlockHint}
                            >
                                {getTimeBlockLabel(activeTimeBlock)}
                            </AccessibleText>
                        )}
                    </View>
                </TouchableOpacity>
            )}

            {/* Secondary Actions */}
            {displayedActions.length > 1 && (
                <View
                    style={[
                        styles.secondaryActions,
                        {
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                        },
                    ]}
                >
                    {displayedActions.slice(1).map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={[
                                styles.secondaryAction,
                                {
                                    backgroundColor: colors.background.white,
                                    ...layout.border.default,
                                },
                            ]}
                            onPress={action.onPress}
                            accessibilityRole="button"
                            accessibilityLabel={
                                language === 'ur' ? action.labelUrdu : action.label
                            }
                        >
                            <Icon
                                name={action.icon as any}
                                size={20}
                                color={colors.primary.forestGreen}
                                active={false}
                            />
                            <AccessibleText
                                variant="caption"
                                color={colors.primary.forestGreen}
                                style={styles.secondaryLabel}
                            >
                                {language === 'ur' ? action.labelUrdu : action.label}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.m,
        paddingBottom: spacing.l,
        backgroundColor: colors.background.cream,
        ...layout.border.default,
        borderTopWidth: 1,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        zIndex: 1000,
    },
    primaryAction: {
        flex: 1,
        height: layout.touchableHeight,
        borderRadius: layout.borderRadius.medium,
        paddingHorizontal: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: spacing.s,
    },
    iconRight: {
        marginLeft: spacing.s,
    },
    actionContent: {
        flex: 1,
    },
    actionLabel: {
        color: colors.background.white,
        fontWeight: '600',
    },
    timeBlockHint: {
        opacity: 0.9,
        marginTop: 2,
    },
    secondaryActions: {
        gap: spacing.s,
    },
    secondaryAction: {
        width: 80,
        height: layout.touchableHeight,
        borderRadius: layout.borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.s,
    },
    secondaryLabel: {
        marginTop: spacing.xs,
        fontSize: 11,
        textAlign: 'center',
    },
});

