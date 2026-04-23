import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import quizReducer from './quizSlice';

export interface AppState {
    quiz: ReturnType<typeof quizReducer>;
}

export const makeStore = () =>
    configureStore<AppState>({
        reducer: {
            quiz: quizReducer,
        },
        devTools: process.env.NODE_ENV !== 'production',
    });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export const wrapper = createWrapper<AppStore>(makeStore);

