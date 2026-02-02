import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import Layout from './layouts'

const App = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {routes.map((route, index) => {
            if (route.index) {
              return <Route key="index" index element={route.element} />
            }
            return <Route key={route.path || index} path={route.path} element={route.element} />
          })}
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
