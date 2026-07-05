import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

// Tipli Redux hook'ları — ekran/bileşen tarafında bunlar kullanılır,
// düz useSelector/useDispatch değil.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
