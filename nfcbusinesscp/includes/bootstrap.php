<?php
session_start();
$dbFile=__DIR__.'/../data/database.sqlite';
if (!is_dir(dirname($dbFile))) mkdir(dirname($dbFile),0755,true);
function db(){static $pdo=null;global $dbFile;if(!$pdo){$pdo=new PDO('sqlite:'.$dbFile);$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$pdo->exec("CREATE TABLE IF NOT EXISTS businesses(card_id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT DEFAULT '',google_review TEXT DEFAULT '',whatsapp TEXT DEFAULT '',instagram TEXT DEFAULT '',facebook TEXT DEFAULT '',youtube TEXT DEFAULT '',location TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)");$pdo->exec("CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT)");}return $pdo;}
function h($s){return htmlspecialchars((string)$s,ENT_QUOTES,'UTF-8');}
function get_setting($k){$s=db()->prepare('SELECT v FROM settings WHERE k=?');$s->execute([$k]);return $s->fetchColumn()?:null;}
function set_setting($k,$v){$s=db()->prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v');$s->execute([$k,$v]);}
function is_admin(){return !empty($_SESSION['admin']);} function login_admin(){session_regenerate_id(true);$_SESSION['admin']=true;}
function csrf_token(){if(empty($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(24));return $_SESSION['csrf'];}
function csrf_check(){if(!hash_equals(csrf_token(),$_POST['csrf']??'')){http_response_code(403);exit('Invalid request token');}}
function flash($m){$_SESSION['flash']=$m;}function take_flash(){$m=$_SESSION['flash']??'';unset($_SESSION['flash']);return $m;}
function public_url($id){$base=rtrim(dirname($_SERVER['SCRIPT_NAME']),'/');return $base.'/'.rawurlencode($id);}
db();
