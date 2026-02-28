export enum TimeOfDayState {
  DawnSurface = 'DawnSurface',
  MiddayExpanse = 'MiddayExpanse',
  TwilightStillness = 'TwilightStillness',
}

export class TimeOfDayStateMachine {
  private currentState: TimeOfDayState;

  constructor(initialState: TimeOfDayState = TimeOfDayState.DawnSurface) {
    this.currentState = initialState;
  }

  getCurrentState(): TimeOfDayState {
    return this.currentState;
  }

  transitionTo(newState: TimeOfDayState): void {
    if (this.currentState !== newState) {
      this.currentState = newState;
    }
  }
}
