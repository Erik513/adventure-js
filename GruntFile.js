	module.exports = function(grunt) {
		grunt.initConfig({
			pkg: grunt.file.readJSON('package.json'),

			concat: {
				options: {
					separator: ';'
				},
				dist: {
					src: [
						'src/**/*.js',
						'src/*.js',
					],
					dest: 'dist/<%= pkg.name %>.js'
				}
			},
			uglify: {
				options: {
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
				},
				dist: {
					files: {
						'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
					}
				}
			},
			jshint: {
				files: ['Gruntfile.js', 'src/*.js', 'src/**/*.js'],
				options: {
					// options here to override JSHint defaults
					globals: {
						jQuery: true,
						console: true,
						module: true,
						document: true
					}
				}
			},
			watch: {
			  src: {
				files: '<%= concat.dist.src %>',
				tasks: ['jshint', 'concat']
			  },
			}
    		});
		grunt.loadNpmTasks('grunt-contrib-uglify');
		grunt.loadNpmTasks('grunt-contrib-jshint');
		grunt.loadNpmTasks('grunt-contrib-concat');
		grunt.loadNpmTasks('grunt-contrib-watch');
		grunt.registerTask('default', ['concat', 'uglify', 'jshint']);
	};