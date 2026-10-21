import React from 'react'
import Map from '@/components/Map'

import Link from 'next/link'

const Contactus = () => {
  return (
    <>
      <section className='contact'>
        <Map/>
        <div className='button-wrap'>
          <Link href='/booking'>
            <span className='secondary-button'>Book Now</span>
          </Link>
        </div>
      </section>
    </>
  )
}

export default Contactus