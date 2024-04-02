import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store.js'

const useAppDispatch: () => AppDispatch = useDispatch

export default useAppDispatch
