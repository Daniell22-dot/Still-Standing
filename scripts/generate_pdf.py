import sys
import json
from fpdf import FPDF
import os

class SafetyPlanPDF(FPDF):
    def header(self):
        # Logo
        self.set_fill_color(44, 62, 80) # Primary Color
        self.rect(0, 0, 210, 40, 'F')
        
        self.set_font('Arial', 'B', 24)
        self.set_text_color(255, 255, 255)
        self.cell(0, 25, 'STILL STANDING', 0, 1, 'C')
        self.set_font('Arial', 'I', 12)
        self.cell(0, -5, 'Your Personal Safety Plan', 0, 1, 'C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'You are not alone. Help is available 24/7 at +254 112 219 135', 0, 0, 'C')

def create_safety_plan(data, output_path):
    pdf = SafetyPlanPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Body
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 10, 'Emergency Contacts', 0, 1, 'L')
    pdf.ln(2)
    
    pdf.set_font('Arial', '', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 10, f"Contact 1: {data.get('contact1', 'Not provided')}\nContact 2: {data.get('contact2', 'Not provided')}")
    pdf.ln(5)
    
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 10, 'Safe Places', 0, 1, 'L')
    pdf.ln(2)
    
    pdf.set_font('Arial', '', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 10, data.get('safePlaces', 'Not provided'))
    pdf.ln(5)
    
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 10, 'Coping Strategies', 0, 1, 'L')
    pdf.ln(2)
    
    pdf.set_font('Arial', '', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 10, data.get('copingStrategies', 'Not provided'))
    pdf.ln(10)
    
    # Emergency Resources Box
    pdf.set_fill_color(232, 244, 252)
    pdf.rect(10, pdf.get_y(), 190, 40, 'F')
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, '  Emergency Resources', 0, 1, 'L')
    pdf.set_font('Arial', '', 11)
    pdf.multi_cell(0, 7, "  • STILL STANDING Crisis Line: +254 112 219 135\n  • WhatsApp Support: +254 968 745 39\n  • Emergency Services: 999")
    
    pdf.output(output_path)
    return output_path

if __name__ == "__main__":
    if len(sys.argv) > 2:
        try:
            input_data = json.loads(sys.argv[1])
            file_name = sys.argv[2]
            
            # Ensure downloads directory exists
            output_dir = os.path.join(os.path.dirname(__file__), '../assets/downloads/safety_plans')
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                
            output_path = os.path.join(output_dir, file_name)
            create_safety_plan(input_data, output_path)
            
            print(json.dumps({"success": True, "file_path": f"/assets/downloads/safety_plans/{file_name}"}))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
    else:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
