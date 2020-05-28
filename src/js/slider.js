import Swiper from 'swiper'
import $ from 'jquery'

const slider = new Swiper('.swiper-container', {
	spaceBetween: 20,
	slidesPerView: 3
})

$('.swiper-container').css('background-color', 'red')