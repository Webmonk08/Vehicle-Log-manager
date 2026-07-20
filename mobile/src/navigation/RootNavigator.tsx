import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "@/screens/Home/HomeScreen";
import { TripsListScreen } from "@/screens/Trips/TripsListScreen";
import { TripCreateScreen } from "@/screens/Trips/TripCreateScreen";
import { TripDetailScreen } from "@/screens/Trips/TripDetailScreen";
import { LoadCreateScreen } from "@/screens/Trips/LoadCreateScreen";
import { DriversListScreen } from "@/screens/Drivers/DriversListScreen";
import { DriverDetailScreen } from "@/screens/Drivers/DriverDetailScreen";
import { VehiclesListScreen } from "@/screens/Vehicles/VehiclesListScreen";
import { VehicleDetailScreen } from "@/screens/Vehicles/VehicleDetailScreen";
import { MoreMenuScreen } from "@/screens/More/MoreMenuScreen";
import { CustomersListScreen } from "@/screens/Customers/CustomersListScreen";
import { ProductsListScreen } from "@/screens/Products/ProductsListScreen";
import { PlacesListScreen } from "@/screens/Places/PlacesListScreen";
import { ChargeRulesListScreen } from "@/screens/ChargeRules/ChargeRulesListScreen";
import { ReportsScreen } from "@/screens/Reports/ReportsScreen";

export type TripsStackParamList = {
  TripsList: undefined;
  TripCreate: undefined;
  TripDetail: { tripId: string };
  LoadCreate: { tripId?: string; loadId?: string };
};

export type DriversStackParamList = {
  DriversList: undefined;
  DriverDetail: { driverId: string };
};

export type VehiclesStackParamList = {
  VehiclesList: undefined;
  VehicleDetail: { vehicleId: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  CustomersList: undefined;
  ProductsList: undefined;
  PlacesList: undefined;
  ChargeRulesList: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator();
const TripsStack = createNativeStackNavigator<TripsStackParamList>();
const DriversStack = createNativeStackNavigator<DriversStackParamList>();
const VehiclesStack = createNativeStackNavigator<VehiclesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator>
      <TripsStack.Screen name="TripsList" component={TripsListScreen} options={{ title: "Trips" }} />
      <TripsStack.Screen name="TripCreate" component={TripCreateScreen} options={{ title: "New Trip" }} />
      <TripsStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: "Trip" }} />
      <TripsStack.Screen name="LoadCreate" component={LoadCreateScreen} options={{ title: "New Load" }} />
    </TripsStack.Navigator>
  );
}

function DriversStackNavigator() {
  return (
    <DriversStack.Navigator>
      <DriversStack.Screen name="DriversList" component={DriversListScreen} options={{ title: "Drivers" }} />
      <DriversStack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ title: "Driver" }} />
    </DriversStack.Navigator>
  );
}

function VehiclesStackNavigator() {
  return (
    <VehiclesStack.Navigator>
      <VehiclesStack.Screen name="VehiclesList" component={VehiclesListScreen} options={{ title: "Vehicles" }} />
      <VehiclesStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Vehicle" }} />
    </VehiclesStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="CustomersList" component={CustomersListScreen} options={{ title: "Customers" }} />
      <MoreStack.Screen name="ProductsList" component={ProductsListScreen} options={{ title: "Products" }} />
      <MoreStack.Screen name="PlacesList" component={PlacesListScreen} options={{ title: "Places" }} />
      <MoreStack.Screen name="ChargeRulesList" component={ChargeRulesListScreen} options={{ title: "Charge Rules" }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
    </MoreStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Trips" component={TripsStackNavigator} />
        <Tab.Screen name="Drivers" component={DriversStackNavigator} />
        <Tab.Screen name="Vehicles" component={VehiclesStackNavigator} />
        <Tab.Screen name="More" component={MoreStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}