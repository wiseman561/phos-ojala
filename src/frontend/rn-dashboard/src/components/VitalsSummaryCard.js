import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Icon } from '../common';
import { colors, typography } from '../../theme';

/**
 * VitalsSummaryCard Component
 * 
 * Displays a summary of the patient's daily vitals including heart rate,
 * sleep, glucose, and blood pressure.
 * 
 * @param {Object} props
 * @param {Object} props.vitals - Object containing vital measurements
 * @param {Object} props.vitals.heartRate - Heart rate data
 * @param {Object} props.vitals.sleep - Sleep data
 * @param {Object} props.vitals.glucose - Blood glucose data
 * @param {Object} props.vitals.bloodPressure - Blood pressure data
 * @param {Function} props.onVitalPress - Function to call when a vital section is pressed
 */
const VitalsSummaryCard = ({ 
  vitals = {
    heartRate: { current: 0, unit: 'bpm', trend: 0, isNormal: true },
    sleep: { current: 0, unit: 'hours', trend: 0, isNormal: true },
    glucose: { current: 0, unit: 'mg/dL', trend: 0, isNormal: true },
    bloodPressure: { 
      systolic: 0, 
      diastolic: 0, 
      unit: 'mmHg', 
      trend: 0, 
      isNormal: true 
    }
  }, 
  onVitalPress 
}) => {
  
  // Helper function to render trend indicator
  const renderTrend = (trend) => {
    if (trend === 0) return null;
    
    const iconName = trend > 0 ? 'arrow-up-right' : 'arrow-down-right';
    const trendColor = trend > 0 ? colors.trend.up : colors.trend.down;
    
    return (
      <View style={styles.trendContainer}>
        <Icon name={iconName} size={14} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {Math.abs(trend)}%
        </Text>
      </View>
    );
  };

  // Helper function to determine status color
  const getStatusColor = (isNormal) => {
    return isNormal ? colors.status.normal : colors.status.abnormal;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Vitals Summary</Text>
        <Text style={styles.date}>Today</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Heart Rate */}
        <TouchableOpacity 
          style={styles.vitalContainer}
          onPress={() => onVitalPress('heartRate')}
          activeOpacity={0.7}
        >
          <View style={styles.vitalHeader}>
            <Icon name="heart-pulse" size={18} color={colors.icon.heartRate} />
            <Text style={styles.vitalTitle}>Heart Rate</Text>
          </View>
          
          <View style={styles.vitalContent}>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{vitals.heartRate.current}</Text>
              <Text style={styles.unitText}>{vitals.heartRate.unit}</Text>
            </View>
            {renderTrend(vitals.heartRate.trend)}
          </View>
          
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(vitals.heartRate.isNormal) }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Sleep */}
        <TouchableOpacity 
          style={styles.vitalContainer}
          onPress={() => onVitalPress('sleep')}
          activeOpacity={0.7}
        >
          <View style={styles.vitalHeader}>
            <Icon name="moon" size={18} color={colors.icon.sleep} />
            <Text style={styles.vitalTitle}>Sleep</Text>
          </View>
          
          <View style={styles.vitalContent}>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{vitals.sleep.current}</Text>
              <Text style={styles.unitText}>{vitals.sleep.unit}</Text>
            </View>
            {renderTrend(vitals.sleep.trend)}
          </View>
          
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(vitals.sleep.isNormal) }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Glucose */}
        <TouchableOpacity 
          style={styles.vitalContainer}
          onPress={() => onVitalPress('glucose')}
          activeOpacity={0.7}
        >
          <View style={styles.vitalHeader}>
            <Icon name="droplet" size={18} color={colors.icon.glucose} />
            <Text style={styles.vitalTitle}>Glucose</Text>
          </View>
          
          <View style={styles.vitalContent}>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{vitals.glucose.current}</Text>
              <Text style={styles.unitText}>{vitals.glucose.unit}</Text>
            </View>
            {renderTrend(vitals.glucose.trend)}
          </View>
          
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(vitals.glucose.isNormal) }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Blood Pressure */}
        <TouchableOpacity 
          style={styles.vitalContainer}
          onPress={() => onVitalPress('bloodPressure')}
          activeOpacity={0.7}
        >
          <View style={styles.vitalHeader}>
            <Icon name="activity" size={18} color={colors.icon.bloodPressure} />
            <Text style={styles.vitalTitle}>Blood Pressure</Text>
          </View>
          
          <View style={styles.vitalContent}>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>
                {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
              </Text>
              <Text style={styles.unitText}>{vitals.bloodPressure.unit}</Text>
            </View>
            {renderTrend(vitals.bloodPressure.trend)}
          </View>
          
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(vitals.bloodPressure.isNormal) }
            ]} 
          />
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Swipe to see more</Text>
        <Icon name="chevron-right" size={16} color={colors.text.secondary} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  date: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  vitalContainer: {
    width: 140,
    height: 120,
    margin: 8,
    padding: 12,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    marginLeft: 6,
  },
  vitalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    ...typography.h2,
    color: colors.text.primary,
  },
  unitText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    ...typography.caption,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

export default VitalsSummaryCard;
