import React from 'react'

const Map = () => {
    return (
        <>
            <section className='map'>
                <div className="container">
                    <h2 className='primary-heading map__heading'>Our Location</h2>
                    <div className="map__content">
                        <div className='map__skyturf'>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3664.3679299608248!2d91.1892033!3d23.302405799999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375481002c1fb9ef%3A0x76ac1ac435dd1a2f!2z4Kat4KeB4Ka24KeN4Kaa4Ka_IOCmsOCnn-Cnh-CmsiDgpp_gpr7gprDgp43gpqsg4KaP4Kao4KeN4KahIOCmuOCngeCmh-CmruCmv-CmgiDgppzgp4vgpqg!5e0!3m2!1sen!2sbd!4v1792572940084!5m2!1sen!2sbd"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className='map__map'
                            ></iframe>
                            <h3 className='our-turfs__turf-name'>Royel Turf & Swimming Zone</h3>
                            <p className='our-turfs__turf-text'>The Home of Football in Buchi</p>
                        </div>

                    </div>
                </div>
            </section>
        </>
    )
}

export default Map