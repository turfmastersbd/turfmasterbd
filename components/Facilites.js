import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Facilites = () => {
    return (
        <>
            <section className='our-facilities'>
                <div className="container">
                    <h2 className='primary-heading our-facilities__heading'>Our Facilites</h2>
                    <div className='our-facilities__content'>
                        <div className='our-facilities__column'>
                            <h3 className='our-facilities__list-heading'>Turf Masters BD Facilities</h3>
                            <div className='our-facilities__list-wrap'>
                                <ul className='our-facilities__list'>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Fast Aid</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Cold water</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Video recording 3 Gool  par slot</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Goalkeeping gloves</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Apron</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Changing room</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Washroom & Shower</li>
                                    <li className='our-facilities__list-item our-facilities__list-item--green'>Cricket football accessories</li>
                                </ul>
                            </div>
                            <Link href="/booking">
                                <span className='secondary-button our-facilities__button'>Book Now</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </section>
        </>
    )
}

export default Facilites