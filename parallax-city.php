<?php
/**
 * @package Parallax_City
 * @version 1.0.0
 */
/*
Plugin Name: Parallax City
Description: Parallax scrolling effect on a city background with security camera.
Author: Máté Homolya
Version: 1.0.0
Author URI: https://github.com/mate-h
*/

$version = '1.0.0';

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once( __DIR__ . '/includes/Svelte.php' );
if ( class_exists( 'Svelte' ) ) {
	$svelte = new Svelte();
}