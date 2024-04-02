import useAppSelector from './use-app-selector.js'

const useConfig = () => useAppSelector((state) => state.config)

export default useConfig
