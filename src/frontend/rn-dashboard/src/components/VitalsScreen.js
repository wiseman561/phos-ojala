import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Header, StatusBar, SearchBar, FilterChip } from '../../components/common';
import { colors, typography } from '../../theme';

/**
 * VitalsScreen Component
 * 
 * Displays a comprehensive view of all patient vitals with
 * filtering, search, and detailed trend analysis.
 */
const VitalsScreen = ({ navigation }) => {
  // Mock vitals data (in a real app, this would come from API/Redux)
  const [vitals, setVitals] = useState([
    {
      id: 'vital1',
      type: 'heart_rate',
      name: 'Heart Rate',
      icon: 'heart-pulse',
      iconColor: colors.icon.heartRate,
      current: 72,
      unit: 'bpm',
      trend: -2,
      isNormal: true,
      range: { min: 60, max: 100 },
      lastUpdated: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'vital2',
      type: 'blood_pressure',
      name: 'Blood Pressure',
      icon: 'activity',
      iconColor: colors.icon.bloodPressure,
      current: { systolic: 120, diastolic: 80 },
      unit: 'mmHg',
      trend: -3,
      isNormal: true,
      range: { 
        systolic: { min: 90, max: 130 },
        diastolic: { min: 60, max: 85 }
      },
      lastUpdated: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'vital3',
      type: 'blood_glucose',
      name: 'Blood Glucose',
      icon: 'droplet',
      iconColor: colors.icon.glucose,
      current: 105,
      unit: 'mg/dL',
      trend: 0,
      isNormal: true,
      range: { min: 70, max: 140 },
      lastUpdated: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: 'vital4',
      type: 'oxygen_saturation',
      name: 'Oxygen Saturation',
      icon: 'wind',
      iconColor: colors.icon.oxygen,
      current: 98,
      unit: '%',
      trend: 1,
      isNormal: true,
      range: { min: 95, max: 100 },
      lastUpdated: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'vital5',
      type: 'sleep',
      name: 'Sleep',
      icon: 'moon',
      iconColor: colors.icon.sleep,
      current: 7.5,
      unit: 'hours',
      trend: 5,
      isNormal: true,
      range: { min: 7, max: 9 },
      lastUpdated: new Date(Date.now() - 28800000).toISOString()
    },
    {
      id: 'vital6',
      type: 'weight',
      name: 'Weight',
      icon: 'trending-up',
      iconColor: colors.icon.weight,
      current: 70.5,
      unit: 'kg',
      trend: -1,
      isNormal: true,
      range: { min: 65, max: 75 },
      lastUpdated: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'vital7',
      type: 'temperature',
      name: 'Temperature',
      icon: 'thermometer',
      iconColor: colors.icon.temperature,
      current: 36.8,
      unit: '°C',
      trend: 0,
      isNormal: true,
      range: { min: 36.1, max: 37.2 },
      lastUpdated: new Date(Date.now() - 172800000).toISOString()
    }
  ]);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVitalType, setSelectedVitalType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  // Helper function to format value based on vital type
  const formatValue = (vital) => {
    if (vital.type === 'blood_pressure') {
      return `${vital.current.systolic}/${vital.current.diastolic}`;
    }
    return vital.current;
  };
  
  // Helper function to format date
  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
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
  
  // Filter vitals based on search and filters
  const filteredVitals = vitals.filter(vital => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!vital.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Vital type filter
    if (selectedVitalType && vital.type !== selectedVitalType) {
      return false;
    }
    
    // Status filter
    if (selectedStatus === 'normal' && !vital.isNormal) {
      return false;
    } else if (selectedStatus === 'abnormal' && vital.isNormal) {
      return false;
    }
    
    return true;
  });
  
  // Handle vital press
  const handleVitalPress = (vital) => {
    navigation.navigate('VitalDetails', { vitalType: vital.type });
  };
  
  // Render individual vital item
  const renderVitalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.vitalItem}
      onPress={() => handleVitalPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <Icon name={item.icon} size={24} color={item.iconColor} />
      </View>
      
      <View style={styles.vitalContent}>
        <View style={styles.vitalHeader}>
          <Text style={styles.vitalName}>{item.name}</Text>
          <Text style={styles.lastUpdated}>{formatLastUpdated(item.lastUpdated)}</Text>
        </View>
        
        <View style={styles.vitalValueContainer}>
          <Text style={styles.vitalValue}>{formatValue(item)}</Text>
          <Text style={styles.vitalUnit}>{item.unit}</Text>
          {renderTrend(item.trend)}
        </View>
        
        <View style={styles.vitalRangeContainer}>
          <Text style={styles.vitalRangeText}>
            Normal range: {
              item.type === 'blood_pressure' 
                ? `${item.range.systolic.min}-${item.range.systolic.max}/${item.range.diastolic.min}-${item.range.diastolic.max}`
                : `${item.range.min}-${item.range.max}`
            } {item.unit}
          </Text>
          
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: item.isNormal ? colors.status.normal : colors.status.abnormal }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="activity" size={48} color={colors.text.disabled} />
      <Text style={styles.emptyStateTitle}>No Vitals Found</Text>
      <Text style={styles.emptyStateText}>
        No vitals match your current filters. Try adjusting your search or filters.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar />
      <Header title="Vitals" showBackButton onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        <SearchBar
          placeholder="Search vitals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <FilterChip
            label="All Vitals"
            selected={selectedVitalType === null}
            onPress={() => setSelectedVitalType(null)}
          />
          <FilterChip
            label="Heart Rate"
            selected={selectedVitalType === 'heart_rate'}
            onPress={() => setSelectedVitalType('heart_rate')}
            color={colors.icon.heartRate}
          />
          <FilterChip
            label="Blood Pressure"
            selected={selectedVitalType === 'blood_pressure'}
            onPress={() => setSelectedVitalType('blood_pressure')}
            color={colors.icon.bloodPressure}
          />
          <FilterChip
            label="Blood Glucose"
            selected={selectedVitalType === 'blood_glucose'}
            onPress={() => setSelectedVitalType('blood_glucose')}
            color={colors.icon.glucose}
          />
          <FilterChip
            label="Sleep"
            selected={selectedVitalType === 'sleep'}
            onPress={() => setSelectedVitalType('sleep')}
            color={colors.icon.sleep}
          />
        </ScrollView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <FilterChip
            label="All Statuses"
            selected={selectedStatus === null}
            onPress={() => setSelectedStatus(null)}
          />
          <FilterChip
            label="Normal"
            selected={selectedStatus === 'normal'}
            onPress={() => setSelectedStatus('normal')}
            color={colors.status.normal}
          />
          <FilterChip
            label="Abnormal"
            selected={selectedStatus === 'abnormal'}
            onPress={() => setSelectedStatus('abnormal')}
            color={colors.status.abnormal}
          />
        </ScrollView>
        
        <FlatList
          data={filteredVitals}
          renderItem={renderVitalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32, // Extra padding at bottom for better scrolling
  },
  vitalItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vitalContent: {
    flex: 1,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vitalName: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  vitalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  vitalValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  vitalUnit: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  trendText: {
    ...typography.caption,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  vitalRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalRangeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default VitalsScreen;
