from bottle import route, run, template, static_file, get, post, request
import random
import json
import pymysql


# Connect to the database
connection = pymysql.connect(host='localhost',
                             user='root',
                             password='',
                             db='adventure-final',
                             charset='utf8',
                             cursorclass=pymysql.cursors.DictCursor)


@route("/", method="GET")
def index():
    return template("adventure.html")


@route("/start", method="POST")
def start():
    username = request.POST.get("name")
    password = request.POST.get("password")
    gender = request.POST.get("gender")
    current_adv_id = request.POST.get("adventure_id")

    # TODO: before adding user

    try:
        with connection.cursor() as cursor:

            sql = "INSERT INTO `adventure-final`.`users` (`idusers`, `user_name`, `password`, `curr_question`, `user_coins`, `user_life`, `gender`) " \
                  "VALUES (NULL, username, password, '1', '100', '100', gender);"

            cursor.execute(sql)
            connection.commit()
            print("user added!")
    except Exception as e:
        print("you failed")


    return json.dumps({"user": username,
                       "adventure": current_adv_id
                       })


@route("/story", method="POST")
def story():
    user_id = request.POST.get("user")
    current_adv_id = request.POST.get("adventure")
    next_story_id = request.POST.get("next") #this is what the user chose - use it!
    next_steps_results = [
        {"id": 1, "option_text": "I run!"},
        {"id": 2, "option_text": "I hide!"},
        {"id": 3, "option_text": "I sleep!"},
        {"id": 4, "option_text": "I fight!"}
        ]
    random.shuffle(next_steps_results) #todo change - used only for demonstration purpouses

    #todo add the next step based on db
    return json.dumps({"user": user_id,
                       "adventure": current_adv_id,
                       "text": "New scenario! What would you do?",
                       "image": "choice.jpg",
                       "options": next_steps_results
                       })


@route('/js/<filename:re:.*\.js$>', method='GET')
def javascripts(filename):
    return static_file(filename, root='js')


@route('/css/<filename:re:.*\.css>', method='GET')
def stylesheets(filename):
    return static_file(filename, root='css')


@route('/images/<filename:re:.*\.(jpg|png|gif|ico)>', method='GET')
def images(filename):
    return static_file(filename, root='images')


def main():
    run(host='localhost', port=9000)


if __name__ == '__main__':
    main()

