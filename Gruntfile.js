'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            files: {
                src: ['lib/main.js'],
                dest: 'build/html5-parser.js',
                options: {
                    alias: ['lib/main.js:Parser']
                }
            }
        },
        concat: {
            options: {
                banner: '/*\n  <%= pkg.title || pkg.name %> <%= pkg.version %>' +
                    '<%= pkg.homepage ? " <" + pkg.homepage + ">" : "" %>' + '\n' +
                    '  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
                    '\n\n  Released under <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n*/\n' +
                    '(function(window, document, undefined) {\n',
                footer: 'window.Parser = require("Parser").Parser;' +
                    '\n})(window, document);',
                stripBanners: true
            },
            dist: {
                src: ['build/html5-parser.js'],
                dest: 'build/html5-parser.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        nodeunit: {
            files: ['test/**/*_test.js']
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib: {
                options: {
                    jshintrc: 'lib/.jshintrc'
                },
                src: ['lib/**/*.js']
            },
            test: {
                src: ['test/**/*.js']
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib: {
                files: '<%= jshint.lib.src %>',
                tasks: ['jshint:lib', 'nodeunit', 'browserify', 'concat']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'nodeunit']
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['jshint', 'nodeunit', 'browserify', 'concat']);

};
