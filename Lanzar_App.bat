@echo off
:: Asegurar que el script se ejecute en la carpeta donde esta guardado
cd /d "%~dp0"
TITLE Tresol ERP - Centro de Control Local

:: Color verde
color 0A

echo.
echo  ==============================================
echo     TRESOL ERP - SISTEMA DE GESTION MODULAR    
echo  ==============================================
echo.

:: --- LIMPIEZA DE ENTORNO ---
echo  [ESTADO] Limpiando procesos previos...

:: Intento simple de cerrar procesos en el puerto 3000
:: Solo intenta cerrar si encuentra un proceso (evita el error en rojo)
powershell -Command "$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if($p){Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue}"

:: Eliminar archivo de bloqueo de Next.js si existe
if exist ".next\dev\lock" (
    echo  [INFO]   Eliminando bloqueo de archivos...
    del /F /Q ".next\dev\lock" >nul 2>&1
)

echo  [OK]     Entorno preparado.
echo.
echo  [INFO]   Lanzando servidor...
echo  [INFO]   Acceso en: http://localhost:3000
echo.

:: Abrir navegador
start http://localhost:3000

:: Iniciar servidor
:: Usamos call para que si falla no cierre la consola inmediatamente
call npm run dev

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] El servidor se detuvo o no pudo iniciar.
    echo.
    echo  Causas posibles:
    echo  1. Node.js no esta en el PATH del sistema.
    echo  2. Falta ejecutar 'npm install' en esta carpeta.
    echo  3. El puerto esta siendo usado por un servicio del sistema.
    echo.
    pause
)

:: Pausa final por si el proceso termina normalmente
echo.
echo  El proceso ha finalizado.
pause


