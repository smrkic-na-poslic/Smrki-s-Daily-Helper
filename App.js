import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView, View, Text, Button, FlatList, TouchableOpacity,
  TextInput, Alert, Platform, PermissionsAndroid
} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = {
  container: {flex: 1, padding: 16, backgroundColor: '#fff'},
  header: {fontSize: 22, fontWeight: '700', marginBottom: 12},
  card: {padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 10},
  input: {borderWidth: 1, padding: 8, marginVertical: 6, borderRadius: 6}
};

export default function App() {
  const managerRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    managerRef.current = new BleManager();
    loadSchedules();
    configureNotifications();

    return () => {
      const m = managerRef.current;
      if (m) m.destroy();
    };
  }, []);

  async function requestAndroidPermissions() {
    if (Platform.OS !== 'android') return true;
    try {
      const ok = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return true;
    } catch (e) {
      console.warn('perm error', e);
      return false;
    }
  }

  async function startScan() {
    const ok = await requestAndroidPermissions();
    if (!ok) return Alert.alert('Permissions required');
    setDevices([]);
    setScanning(true);
    managerRef.current.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('scan error', error);
        setScanning(false);
        return;
      }
      if (!device || !device.id) return;
      setDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, {id: device.id, name: device.name || 'Unknown'}];
      });
    });

    // stop after 8 seconds
    setTimeout(() => {
      try { managerRef.current.stopDeviceScan(); } catch(e) {}
      setScanning(false);
    }, 8000);
  }

  function configureNotifications() {
    PushNotification.configure({
      onRegister: function(token) {
        console.log('TOKEN:', token);
      },
      onNotification: function(notification) {
        console.log('NOTIF', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
  }

  async function loadSchedules() {
    try {
      const raw = await AsyncStorage.getItem('@schedules_v1');
      if (raw) setSchedules(JSON.parse(raw));
    } catch (e) { console.warn(e); }
  }

  async function saveSchedules(next) {
    setSchedules(next);
    await AsyncStorage.setItem('@schedules_v1', JSON.stringify(next));
  }

  function scheduleNotification(item) {
    // item: {id,title,time}
    // For simplicity we'll schedule at a fixed time today/time parsing is naive
    const [hh, mm] = (item.time || '09:00').split(':').map(s => parseInt(s,10)||0);
    const when = new Date();
    when.setHours(hh, mm, 0, 0);
    if (when < new Date()) when.setDate(when.getDate()+1);
    PushNotification.localNotificationSchedule({
      id: item.id,
      message: item.title || 'Reminder',
      date: when,
      allowWhileIdle: true,
    });
    Alert.alert('Scheduled', `Notification scheduled at ${when.toLocaleString()}`);
  }

  function createAlarmFromSchedule(item) {
    scheduleNotification(item);
  }

  async function addSchedule() {
    if (!newTitle || !newTime) return Alert.alert('Fill both title and time');
    const id = Date.now().toString();
    const item = {id, title: newTitle, time: newTime};
    const next = [...schedules, item];
    await saveSchedules(next);
    setNewTitle(''); setNewTime('');
    scheduleNotification(item);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Smrki — Daily Helper (converted)</Text>

      <View style={styles.card}>
        <Text style={{fontWeight:'600'}}>Bluetooth Devices</Text>
        <Button title={scanning ? 'Scanning...' : 'Start scan'} onPress={startScan} disabled={scanning} />
        <FlatList
          data={devices}
          keyExtractor={i=>i.id}
          renderItem={({item}) => (
            <View style={{padding:8}}>
              <Text>{item.name} — {item.id}</Text>
              <Button title="Connect (not implemented)" onPress={()=>Alert.alert('Connect', item.id)} />
            </View>
          )}
        />
      </View>

      <View style={styles.card}>
        <Text style={{fontWeight:'600'}}>Schedules & Alarms</Text>
        <FlatList
          data={schedules}
          keyExtractor={i=>i.id}
          renderItem={({item}) => (
            <View style={{padding:8}}>
              <Text>{item.time} — {item.title}</Text>
              <Button title='Set Alarm' onPress={() => createAlarmFromSchedule(item)} />
            </View>
          )}
        />
        <TextInput style={styles.input} placeholder='Title' value={newTitle} onChangeText={setNewTitle} />
        <TextInput style={styles.input} placeholder='Time (HH:MM)' value={newTime} onChangeText={setNewTime} />
        <Button title='Add to schedule & set alarm' onPress={addSchedule} />
      </View>
    </SafeAreaView>
  );
}
