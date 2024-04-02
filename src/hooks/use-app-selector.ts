import { useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '../store.js'

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default useAppSelector
