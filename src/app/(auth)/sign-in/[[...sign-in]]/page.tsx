import { SignIn } from '@clerk/nextjs'
import React from 'react'

const SignInPage = () => {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-gray-100">
        <SignIn/>
    </main>
  )
}
export default SignInPage
