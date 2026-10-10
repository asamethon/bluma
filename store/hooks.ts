import { useDispatch, useSelector } from 'react-redux';
import type { RootState, store } from './index';

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
