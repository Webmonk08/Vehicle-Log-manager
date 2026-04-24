import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useDashboard } from '@/hooks/useApi';
import StatCard from '@/components/StatCard';
import { LoadingState, ErrorState } from '@/components/StateViews';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Period = 'weekly' | 'monthly' | 'yearly';

export default function DashboardScreen() {
  const [period, setPeriod] = useState<Period>('monthly');
  const { data, isLoading, isError, refetch } = useDashboard(period);

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (isError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  // Provide fallback data for demo when API isn't connected or returns partial data
  const dashboard = {
    total_income: data?.total_income ?? 0,
    total_expenses: data?.total_expenses ?? 0,
    net_profit: data?.net_profit ?? 0,
    active_trips: data?.active_trips ?? 0,
    pending_settlements: data?.pending_settlements ?? 0,
    tax_reminders_count: data?.tax_reminders_count ?? 0,
    period_data: Array.isArray(data?.period_data) ? data.period_data : [],
  };

  // If we have no data at all from API, use some demo data for better first impression
  const hasPeriodData = Array.isArray(data?.period_data) && data.period_data.length > 0;
  const isActuallyEmpty = (!data || !hasPeriodData) && !isLoading;
  const finalDashboard = isActuallyEmpty ? {
    total_income: 245000,
    total_expenses: 87500,
    net_profit: 157500,
    active_trips: 3,
    pending_settlements: 8,
    tax_reminders_count: 2,
    period_data: [
      { label: 'Nov', income: 32000, expenses: 12000, net_profit: 20000 },
      { label: 'Dec', income: 41000, expenses: 15000, net_profit: 26000 },
      { label: 'Jan', income: 38000, expenses: 14000, net_profit: 24000 },
      { label: 'Feb', income: 45000, expenses: 16000, net_profit: 29000 },
      { label: 'Mar', income: 42000, expenses: 13500, net_profit: 28500 },
      { label: 'Apr', income: 47000, expenses: 17000, net_profit: 30000 },
    ],
  } : dashboard;

  const periodData = Array.isArray(finalDashboard?.period_data) ? finalDashboard.period_data : [];
  const hasData = periodData.length > 0;
  
  console.log(hasData)
  const chartLabels = hasData ? periodData.map(p => p.label || '') : [];
  const incomeData = hasData ? periodData.map(p => Number(p.income) || 0) : [];
  const expenseData = hasData ? periodData.map(p => Number(p.expenses) || 0) : [];
  const profitData = hasData ? periodData.map(p => Number(p.net_profit) || 0) : [];
  console.log("ExpenseData",expenseData)
  console.log("IncomeData" , incomeData)
  console.log("ProfitData", profitData)
  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: true,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      stroke: Colors.chartGrid,
      strokeWidth: 1,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
  };

  console.log(periodData)
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
      }
    >
      {/* Hero Section */}
      <LinearGradient
        colors={['#ffffff', '#f5f5f5', '#ebebeb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroLabel}>Net Profit</Text>
        <Text style={styles.heroValue}>₹{finalDashboard.net_profit.toLocaleString('en-IN')}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroStatText}>
              Income: ₹{finalDashboard.total_income.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Ionicons name="trending-down" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroStatText}>
              Expense: ₹{finalDashboard.total_expenses.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatCard
          title="Active Trips"
          value={String(finalDashboard.active_trips)}
          icon={<Ionicons name="navigate" size={16} color={Colors.primary} />}
          style={{ flex: 1 }}
        />
        <StatCard
          title="Pending"
          value={String(finalDashboard.pending_settlements)}
          icon={<Ionicons name="time" size={16} color={Colors.warning} />}
          style={{ flex: 1 }}
        />
        <StatCard
          title="Tax Due"
          value={String(finalDashboard.tax_reminders_count)}
          icon={<Ionicons name="alert-circle" size={16} color={Colors.error} />}
          style={{ flex: 1 }}
        />
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

{/* Income vs Expenses Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Income vs Expenses</Text>
        {/* {hasData && incomeData.length > 0 && expenseData.length > 0 ? (
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: incomeData,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                },
                {
                  data: expenseData,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                },
              ],
            }}
            width={SCREEN_WIDTH - 64}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showBarTops={false}
            withCustomBarColorFromData={true}
            flatColor={true}
            yAxisLabel="₹"
            yAxisSuffix=""
          />
        ) : (
          <View style={[styles.chart, { height: 200, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: Colors.textSecondary }}>No income or expense data to display.</Text>
          </View>
        )} */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.chartIncome }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.chartExpense }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </View>

      {/* Profit Trend Line Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Profit Trend</Text>
        {Math.max(...profitData) > 0 ? (
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: profitData,
                  color: (o = 1) => `rgba(37, 99, 235, ${o})`,
                  strokeWidth: 3,
                },
              ],
            }}
            width={SCREEN_WIDTH - 64}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (o = 1) => `rgba(37, 99, 235, ${o})`,
            }}
            bezier
            style={styles.chart}
            fromZero
            yAxisLabel="₹"
            yAxisSuffix=""
          />
        ) : (
          <View style={[styles.chart, { height: 180, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: Colors.textSecondary }}>No profit data to display.</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    ...Shadow.elevated,
  },
  heroLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
    marginVertical: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: FontSize.sm,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: '#000',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  chart: {
    borderRadius: Radius.md,
    marginLeft: -16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
