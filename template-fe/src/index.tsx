import './index.css'

import {StrictMode, Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import {Route} from 'react-router'
import {BrowserRouter, Routes} from 'react-router-dom'
import {ApolloProvider} from './context'
import {Entry} from './pages'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="center">loading...</div>}>
          <Routes>
            <Route path="/" Component={Entry}></Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>
)
