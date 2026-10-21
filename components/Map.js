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
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.974323693641!2d90.36959767341614!3d23.85504549422768!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7007cc50745%3A0x6e69435fa247ab14!2sSetu%20Housing!5e0!3m2!1sen!2sbd!4v1792592741299!5m2!1sen!2sbd"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className='map__map'
                            ></iframe>
                            <h3 className='our-turfs__turf-name'>Turf Masters BD</h3>
                            <p className='our-turfs__turf-text'>The Home of Football in Buchi</p>
                        </div>

                    </div>
                </div>
            </section>
        </>
    )
}

export default Map