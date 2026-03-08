import codecs
import re
import sys

file_path = r'c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\pages\admin\dashboard_admin.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    text = f.read()

# Buscamos el bloque desde Vista Resumen hasta ESTRUCTURA PRINCIPAL
match = re.search(r'(// =========================================================================\r?\n\s*// VISTA: RESUMEN.*?)(// --- ESTRUCTURA PRINCIPAL ---)', text, re.DOTALL)

if match:
    block = match.group(1)
    # Removemos el bloque de donde estaba
    text = text.replace(block, '')
    
    # Agregamos props a las funciones
    block = block.replace('const VistaResumen = () => {', 'const VistaResumen = ({ infoAvesMap, navegarA }: { infoAvesMap: any, navegarA: any }) => {')
    
    # Actualizamos las llamadas dentro de DashboardAdmin
    text = text.replace('<VistaResumen />', '<VistaResumen infoAvesMap={infoAvesMap} navegarA={navegarA} />')
    
    # Insertamos el bloque justo ANTES de DashboardAdmin
    text = text.replace('export const DashboardAdmin = () => {', block + '\nexport const DashboardAdmin = () => {')
    
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED TO MATCH')
