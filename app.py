from imutils.video import VideoStream
from flask import Response
from flask import Flask
from flask import request
from flask import render_template
from flask import redirect
from flask import url_for
from flask import session
from datetime import timedelta
import threading
import argparse
import datetime
import imutils
import time
import cv2
import numpy
import json

app = Flask(__name__)
app.secret_key = "super secret key"
app.permanent_session_lifetime = timedelta(minutes=5)

myjsonfile = open('jetson_config.json','r')
jsondata = myjsonfile.read()
obj = json.loads(jsondata)

userJSON = str(obj['jetson_user'])
passJSON = str(obj['jetson_pass'])

@app.route("/")
def default():
	return redirect("/login")

@app.route("/login", methods=['POST', 'GET'])
def login():
	error = None

	if request.method == 'POST' and request.form['submit_button'] == 'Login':
		user = request.form['user']
		password = request.form['password']
		session['admin'] = userJSON
		session.permanent = True

		if user == userJSON and password == passJSON:
			return redirect('/live', code=302)
		else:
			error = "Username or password not correct"
	elif "admin" in session:
		return redirect(url_for("home"))

	return render_template('/main/index.html', error=error)

@app.route('/logout')
def logout():
	session.pop("admin", None)
	return redirect(url_for('login'))

@app.route("/live")
def home():
	if "admin" not in session:
		return redirect(url_for('login'), code=302)

	return render_template("/main/live.html")

@app.route("/setup/addcam", methods=['POST', 'GET'])
def setup():
	if "admin" not in session:
		return redirect(url_for('login'))

	path = './jetson/'
	filename = 'camera_info'
	data = {}

	if request.method == "POST":
		if request.form['submit_button'] == 'Add':
			data['camera_name'] = request.form['camera_name']
			data['camera_id'] = request.form['camera_id']
			data['camera_link'] = request.form['camera_link']
			jsonToFile(path, filename, data)
			gen(reload=True)
		elif request.form['submit_button'] == 'Check':
			data['camera_name'] = request.form['camera_name']
			data['camera_id'] = request.form['camera_id']
			data['camera_link'] = request.form['camera_link']

			return redirect('/checkcamera?camera_name={}&camera_id={}&camera_link={}'.format(data['camera_name'],data['camera_id'],data['camera_link']), code=302)

	return render_template("/main/setup.html")

@app.route('/setup/zone', methods=['POST', 'GET'])
def zone():
	if "admin" not in session:
		return redirect(url_for('login'))

	if request.method == 'POST':
		data = request.get_json()
		if 'command' not in data:
			location = './jetson/'
			fileName = 'zone_info'
			jsonToFile(location, fileName, data)
			return redirect('/setup/zone?status=success')
			
		else:
			print('restart')
			
		
	return render_template('/main/setup-zone.html')

@app.route('/video_feed', methods=['POST', 'GET'])
def video_feed():
	if "admin" not in session:
		return redirect(url_for('login'))

	return Response(gen(),mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/checkcamera')
def checkcamera():
	if "admin" not in session:
		return redirect(url_for('login'))

	name = request.args.get('camera_name')
	id = request.args.get('camera_id')
	link = request.args.get('camera_link')
	return '''<h2>The Camera Name Is : {}</h2>
			  <h2>The Camera Id Is : {}</h2>
			  <h2>The Camera Link Is : {}</h2>'''.format(name,id,link)

def jsonToFile(path, filename, data):
	formatFile = './' + path + '/' + filename + '.json'
	with open(formatFile, 'w') as fp:
		json.dump(data, fp)

def gen(reload=False):
	file = open('jetson/camera_info.json','r')
	fileData = file.read()
	objData = json.loads(fileData)
	camLink = str(objData['camera_link'])

	cap = cv2.VideoCapture(camLink)

	if cap.isOpened() == False:
		print('Video Not Found')

	while(cap.isOpened()):
			ret, img = cap.read()
			if ret == True:
				img = cv2.resize(img, (0,0), fx=1.0, fy=1.0)
				frame = cv2.imencode('.jpg', img)[1].tobytes()
				yield(b'--frame\r\n'b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
				time.sleep(0.1)
			else:
				break
	
	if reload == True:
		cap.release()
		return gen()

def logout_asd():
	session.clear()
	return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5556)

