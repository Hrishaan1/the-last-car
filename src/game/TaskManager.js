// The Last Car - Daily Tasks System (Similar to Among Us maintenance routines)
import { sound } from '../audio/SoundEngine.js';

export const TASK_DEFINITIONS = {
  wires: {
    id: 'wires',
    title: 'Fix Auxiliary Wiring',
    location: 'Breaker Panel',
    propId: 'breaker_panel',
    desc: 'Match colored transit wires to prevent emergency circuit overload.'
  },
  window: {
    id: 'window',
    title: 'Wipe Window Condensation',
    location: 'Platform Window',
    propId: 'window_wipe',
    desc: 'Clear moisture and frost from the glass to inspect platform perimeter.'
  },
  vent: {
    id: 'vent',
    title: 'Clean Air Intake Filter',
    location: 'Ceiling Air Grate',
    propId: 'vent_grate',
    desc: 'Clear soot and debris obstructing the passenger ventilation duct.'
  },
  pressure: {
    id: 'pressure',
    title: 'Check Door Pressure Seal',
    location: 'Center Subway Doors',
    propId: 'subway_doors',
    desc: 'Pump the pneumatic valve to ensure radiation blast seals remain seated.'
  },
  radio: {
    id: 'radio',
    title: 'Calibrate Radio Frequency',
    location: 'Emergency Intercom',
    propId: 'emergency_intercom',
    desc: 'Tune receiver needle to civil defense carrier frequency.'
  }
};

export class TaskManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.listeners = new Set();
    this.dailyTasks = [];
    this.taskDay = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this));
  }

  // Generate tasks for the current day
  refreshDailyTasks(day) {
    this.taskDay = day;

    // Pick 3 or 4 tasks tailored for the day
    let taskKeys = ['wires', 'window', 'vent', 'pressure'];

    // On days 5+, add radio calibration
    if (day >= 5) {
      taskKeys = ['wires', 'window', 'vent', 'pressure', 'radio'];
    }

    // Curate 3 to 4 tasks per day
    const count = day < 3 ? 3 : 4;
    const shuffled = [...taskKeys].sort(() => 0.5 - Math.random());
    const selectedKeys = shuffled.slice(0, count);

    // Make sure 'window' is always included on Day 10 for the Woman reveal!
    if (day === 10 && !selectedKeys.includes('window')) {
      selectedKeys[0] = 'window';
    }

    this.dailyTasks = selectedKeys.map((key) => {
      const def = TASK_DEFINITIONS[key];
      return {
        id: def.id,
        title: def.title,
        location: def.location,
        propId: def.propId,
        desc: def.desc,
        completed: false
      };
    });

    this.notify();
  }

  getTodayTasks() {
    if (this.dailyTasks.length === 0 || this.taskDay !== this.gameState.day) {
      this.refreshDailyTasks(this.gameState.day);
    }
    return this.dailyTasks;
  }

  isTaskAvailableForProp(propId) {
    const tasks = this.getTodayTasks();
    return tasks.find((t) => t.propId === propId && !t.completed);
  }

  completeTask(taskId) {
    const task = this.dailyTasks.find((t) => t.id === taskId);
    if (!task || task.completed) return false;

    task.completed = true;
    sound.playTaskComplete();

    // Reward: reduce stress / fatigue slightly
    this.gameState.fatigue = Math.max(0, this.gameState.fatigue - 8);

    const completedCount = this.dailyTasks.filter((t) => t.completed).length;
    const totalCount = this.dailyTasks.length;

    this.notify();

    return {
      task,
      allCompleted: completedCount === totalCount,
      completedCount,
      totalCount
    };
  }

  areAllTasksCompleted() {
    if (this.dailyTasks.length === 0) return true;
    return this.dailyTasks.every((t) => t.completed);
  }
}
