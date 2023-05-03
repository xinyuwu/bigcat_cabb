#!/usr/bin/env python

from setuptools import setup, find_packages

setup(
	name='cabb-server',
	setup_requires=[],
	url='',
	license='Proprietary License',
	packages=find_packages(),
	entry_points={
		'console_scripts': [
			'cabb_server = cabb.app'
		]
	}
)
