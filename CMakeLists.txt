cmake_minimum_required(VERSION 2.8.3)
project(rospilot)

## Find catkin macros and libraries
## if COMPONENTS list like find_package(catkin REQUIRED COMPONENTS xyz)
## is used, also find other catkin packages
find_package(catkin REQUIRED COMPONENTS geometry_msgs sensor_msgs std_msgs message_generation roslint roscpp)
find_package(PkgConfig REQUIRED)
find_package(OpenCV 3 REQUIRED)
pkg_check_modules(libgphoto2 REQUIRED libgphoto2)
pkg_check_modules(libavcodec REQUIRED libavcodec)
pkg_check_modules(libavformat REQUIRED libavformat)
pkg_check_modules(libavutil REQUIRED libavutil)
pkg_check_modules(libswscale REQUIRED libswscale)
pkg_check_modules(libnl-3.0 REQUIRED libnl-3.0)
pkg_check_modules(libnl-genl-3.0 REQUIRED libnl-genl-3.0)
pkg_check_modules(libmicrohttpd REQUIRED libmicrohttpd)

catkin_python_setup()

file(GLOB python_source_files nodes/*.py)
roslint_python(${python_source_files})
roslint_add_test()

## System dependencies are found with CMake's conventions
# find_package(Boost REQUIRED COMPONENTS system)


## Uncomment this if the package has a setup.py. This macro ensures
## modules and global scripts declared therein get installed
## See http://ros.org/doc/api/catkin/html/user_guide/setup_dot_py.html
# catkin_python_setup()

 include(CheckCXXCompilerFlag)
 CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
 CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X)
 if(COMPILER_SUPPORTS_CXX11)
     set(CMAKE_CXX_FLAGS "-std=c++11")
 elseif(COMPILER_SUPPORTS_CXX0X)
     set(CMAKE_CXX_FLAGS "-std=c++0x")
 else()
     message(FATAL_ERROR "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.")
 endif()

# XXX: Awful hack because libturbojpeg doesn't come with pkg-config file
set(LIBJPEG_TURBO_PATH "/usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/libturbojpeg.so.0")
#######################################
## Declare ROS messages and services ##
#######################################

## Generate messages in the 'msg' folder
add_message_files(
  FILES
  Attitude.msg
  BasicStatus.msg
  RCState.msg
  GPSRaw.msg
  Resolution.msg
  Resolutions.msg
  Waypoint.msg
  Waypoints.msg
  VisionTarget.msg
  VisionTargets.msg
  IMURaw.msg
)

## Generate services in the 'srv' folder
add_service_files(
  FILES
  SetBasicMode.srv
  SetWaypoints.srv
  CaptureImage.srv
)

## Generate added messages and services with any dependencies listed here
generate_messages(
    DEPENDENCIES
    std_msgs
    geometry_msgs
    sensor_msgs
)

###################################
## catkin specific configuration ##
###################################
## The catkin_package macro generates cmake config files for your package
## Declare things to be passed to dependent projects
## LIBRARIES: libraries you create in this project that dependent projects also need
## CATKIN_DEPENDS: catkin_packages dependent projects also need
## DEPENDS: system dependencies of this project that dependent projects also need
catkin_package(
#  INCLUDE_DIRS include
#  LIBRARIES rospilot
#  CATKIN_DEPENDS geometry_msgs sensor_msgs std_msgs
  CATKIN_DEPENDS message_runtime
#  DEPENDS system_lib
)


###############################
## Generate Javascript files ##
###############################

# Likely need a newer npm version
add_custom_command(OUTPUT ${CMAKE_BINARY_DIR}/node_modules/npm/cli.js
    COMMAND npm install npm 2> /dev/null
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
    COMMENT "Updating npm")

add_custom_command(OUTPUT DIRECTORY share/web_assets/node_modules
    COMMAND ${CMAKE_BINARY_DIR}/node_modules/npm/cli.js install
    DEPENDS share/web_assets/package.json ${CMAKE_BINARY_DIR}/node_modules/npm/cli.js
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}/share/web_assets
    COMMENT "Building Javascript files")

add_custom_target(javascript_assets ALL
    DEPENDS DIRECTORY share/web_assets/node_modules)
###########
## Build ##
###########

## Specify additional locations of header files
## Your package locations should be listed before other locations
include_directories(include src/cpp
    ${OpenCV_INCLUDE_DIRS}
    ${catkin_INCLUDE_DIRS}
    ${libnl-3.0_INCLUDE_DIRS}
    ${libnl-genl-3.0_INCLUDE_DIRS}
    ${libmicrohttpd_INCLUDE_DIRS}
    ${libavcodec_INCLUDE_DIRS}
    ${libavformat_INCLUDE_DIRS}
    ${libavutil_INCLUDE_DIRS}
    ${libswscale_INCLUDE_DIRS}
    ${Boost_INCLUDE_DIRS})

## Declare a cpp library
# add_library(rospilot
#   src/${PROJECT_NAME}/rospilot.cpp
# )

## Declare a cpp executable
# add_executable(rospilot_node src/rospilot_node.cpp)

## Add cmake target dependencies of the executable/library
## as an example, message headers may need to be generated before nodes
# add_dependencies(rospilot_node rospilot_generate_messages_cpp)

## Specify libraries to link a library or executable target against
# target_link_libraries(rospilot_node
#   ${catkin_LIBRARIES}
# )

add_executable(choose_wifi_device
    src/cpp/choose_wifi_device.cpp)
target_link_libraries(choose_wifi_device 
    ${libnl-3.0_LIBRARIES}
    ${libnl-genl-3.0_LIBRARIES}
    ${catkin_LIBRARIES})

add_executable(camera_node
    nodes/camera.cpp
    src/cpp/usb_camera.cpp
    src/cpp/ptp.cpp
    src/cpp/background_image_sink.cpp
    src/cpp/jpeg_decoder.cpp
    src/cpp/h264_server.cpp
    src/cpp/people_detector.cpp
    src/cpp/resizer.cpp
    src/cpp/software_h264_encoder.cpp
    src/cpp/mfc_encoder.cpp
    src/cpp/third_party/usb_cam.cpp
    src/cpp/third_party/mfc/func_dev.c
    src/cpp/third_party/mfc/io_dev.c
    src/cpp/third_party/mfc/v4l_dev.c
    src/cpp/third_party/mfc/mfc.c
    src/cpp/video_recorder.cpp)
target_link_libraries(camera_node 
    ${OpenCV_LIBRARIES}
    ${LIBJPEG_TURBO_PATH}
    ${libgphoto2_LIBRARIES}
    ${libavcodec_LIBRARIES}
    ${libmicrohttpd_LIBRARIES}
    ${libavutil_LIBRARIES}
    ${libavformat_LIBRARIES}
    ${libswscale_LIBRARIES}
    ${catkin_LIBRARIES})
add_dependencies(camera_node rospilot_gencpp)

add_executable(jpeg_benchmark
    scripts/jpeg_benchmark.cpp
    src/cpp/jpeg_decoder.cpp
    src/cpp/resizer.cpp)
target_link_libraries(jpeg_benchmark 
    ${LIBJPEG_TURBO_PATH}
    ${libavcodec_LIBRARIES}
    ${libavutil_LIBRARIES}
    ${libavformat_LIBRARIES}
    ${libswscale_LIBRARIES}
    ${catkin_LIBRARIES})

#############
## Install ##
#############

# all install targets should use catkin DESTINATION variables
# See http://ros.org/doc/api/catkin/html/adv_user_guide/variables.html

## Mark executable scripts (Python etc.) for installation
## in contrast to setup.py, you can choose the destination
file(GLOB nodes nodes/*)
install(PROGRAMS
  ${nodes}
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

file(GLOB scripts scripts/*.sh)
install(PROGRAMS
  ${scripts}
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

## Mark executables and/or libraries for installation
install(TARGETS camera_node
  ARCHIVE DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

install(TARGETS choose_wifi_device 
  ARCHIVE DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
## Mark cpp header files for installation
# install(DIRECTORY include/${PROJECT_NAME}/
#   DESTINATION ${CATKIN_PACKAGE_INCLUDE_DESTINATION}
#   FILES_MATCHING PATTERN "*.h"
#   PATTERN ".svn" EXCLUDE
# )

install(FILES
  launch/rospilot.launch
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
)
install(DIRECTORY
  share/
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}/share
  PATTERN "mapnik-style/data" EXCLUDE
)

#############
## Testing ##
#############

## Add gtest based cpp test target and link libraries
# catkin_add_gtest(${PROJECT_NAME}-test test/test_rospilot.cpp)
# if(TARGET ${PROJECT_NAME}-test)
#   target_link_libraries(${PROJECT_NAME}-test ${PROJECT_NAME})
# endif()

## Add folders to be run by python nosetests
# catkin_add_nosetests(test)
